const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const csv = require("csv-parser");
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;

module.exports.getProductsList = async (event) => {
  try {
    const params = {
      TableName: PRODUCTS_TABLE,
      ProjectionExpression: "id, title, description, price",
      ScanIndexForward: false,
    };
    const productsResult = await dynamodb.scan(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(productsResult.Items),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ error: "Failed to get products list" }),
    };
  }
};

module.exports.getProductsById = async (event) => {
  const productId = event.productId;
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      id: productId,
    },
  };

  try {
    const result = await dynamodb.get(params).promise();
    const product = result.Item;
    if (!product) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ error: "Product not found" }),
      };
    }
    const stockParams = {
      TableName: STOCK_TABLE,
      Key: { product_id: productId },
    };
    const stockResult = await dynamodb.get(stockParams).promise();
    const stock = stockResult.Item ? stockResult.Item.count : 0;
    product.stock = stock;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ error: "Failed to get product by id" }),
    };
  }
};

module.exports.createProduct = async (event) => {
  const { name, price, stock } = JSON.parse(event.body);
  const productId = uuidv4();
  const params = {
    TableName: PRODUCTS_TABLE,
    Item: { id, name, price },
  };

  try {
    await dynamodb.put(params).promise();

    if (stock) {
      const stockParams = {
        TableName: STOCK_TABLE,
        Item: { product_id: productId, stock },
      };
      await dynamodb.put(stockParams).promise();
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ id: productId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create product" }),
    };
  }
};

module.exports.importProductsFile = async (event) => {
  const { name } = event.queryStringParameters;
  const params = {
    Bucket: "emmauploaded",
    Key: `uploaded/${name}`,
    Expires: 3600,
    ContentType: "text/csv",
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise("putObject", params);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: signedUrl,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ error: "Failed to generate signed URL" }),
    };
  }
};

module.exports.importFileParser = async (event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;

      const params = {
        Bucket: bucket,
        Key: key,
      };

      const stream = s3.getObject(params).createReadStream();

      const parser = stream.pipe(csvParser());

      for await (const data of parser) {

        await sqs
          .sendMessage({
            QueueUrl:
              "https://sqs.us-east-1.amazonaws.com/130956142913/catalogItemsQueue",
            MessageBody: JSON.stringify(data),
          })
          .promise();
      }
    }

    return {
      statusCode: 202,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      body: "CSV records sent to SQS successfully",
    };
  } catch (error) {
    console.error("Error processing CSV:", error);
    throw error;
  }
};

module.exports.catalogBatchProcess = async (event) => {
  try {
    const sns = new AWS.SNS();
    const topicArn = process.env.CREATE_PRODUCT_TOPIC_ARN;

    for (const { body } of event.Records) {
      const product = JSON.parse(body);
      await createProduct(product);
    }

    await sns.publish({
      TopicArn: topicArn,
      MessageStructure: 'json',
      Message: 'Products created successfully',
    }).promise();

    return {
      statusCode: 200,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      body: 'Batch process completed successfully',
    };
  } catch (error) {
    console.error('Error processing batch:', error);
    throw error;
  }
};

const createProduct = async (product) => {
  const params = {
    TableName: "products",
    Item: product,
  };

  await dynamodb.put(params).promise();
};

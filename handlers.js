const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;

module.exports.getProductsList = async (event) => {
  try {
    const params = {
      TableName: PRODUCTS_TABLE,
      ProjectionExpression: 'id, #name, price, stock',
      ExpressionAttributeNames: { '#name': 'name' },
      ScanIndexForward: false
    };
    const result = await dynamodb.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get products list' })
    };
  }
};

module.exports.getProductsById = async (event) => {
  const productId = event.pathParameters.productId;
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { id: productId }
  };

  try {
    const result = await dynamodb.get(params).promise();
    const product = result.Item;
    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' })
      };
    }

    const stockParams = {
      TableName: STOCK_TABLE,
      Key: { productId }
    };
    const stockResult = await dynamodb.get(stockParams).promise();
    const stock = stockResult.Item ? stockResult.Item.stock : 0;
    product.stock = stock;

    return {
      statusCode: 200,
      body: JSON.stringify(product)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get product by id' })
    };
  }
};

module.exports.createProduct = async (event) => {
  const { name, price, stock } = JSON.parse(event.body);
  const productId = uuidv4();
  const params = {
    TableName: PRODUCTS_TABLE,
    Item: { id: productId, name, price }
  };

  try {
    await dynamodb.put(params).promise();

    if (stock) {
      const stockParams = {
        TableName: STOCK_TABLE,
        Item: { productId, stock }
      };
      await dynamodb.put(stockParams).promise();
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ id: productId })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create product' })
    };
  }
};

const AWS = require("aws-sdk");


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
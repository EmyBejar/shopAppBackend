const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient();

const products = [
  {
    id: uuidv4(),
    title: 'Product 4',
    description: 'This is the 4 product',
    price: 10,
  },
  {
    id: uuidv4(),
    title: 'Product 5',
    description: 'This is the 5 product',
    price: 20,
  },
  {
    id: uuidv4(),
    title: 'Product 6',
    description: 'This is the 6 product',
    price: 30,
  },
];

products.forEach(async (product) => {
  const params = {
    TableName: 'products',
    Item: {
        'id': {S: product.id},
        'title': {S: product.title},
        'description': {S: product.description},
        'price': {N: product.price.toString()}
      }
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log('PutItem succeeded:', product.id);
  } catch (err) {
    console.error('Unable to add product', product.id, '. Error JSON:', JSON.stringify(err, null, 2));
  }
});

const stocks = [
  {
    product_id: products[0].id,
    count: 10,
  },
  {
    product_id: products[1].id,
    count: 5,
  },
  {
    product_id: products[2].id,
    count: 3,
  },
];

stocks.forEach(async (stock) => {
  const params = {
    TableName: 'stock',
    Item: {
        'product_id': {S: stock.product_id},
        'count': {N: stock.count.toString()}
      }
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log('PutItem succeeded:', stock.product_id);
  } catch (err) {
    console.error('Unable to add stock', stock.product_id, '. Error JSON:', JSON.stringify(err, null, 2));
  }
});

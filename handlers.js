const products = [
    { id: 1, name: 'Product 1', price: 10.99 },
    { id: 2, name: 'Product 2', price: 20.99 },
    { id: 3, name: 'Product 3', price: 30.99 },
  ];
  
  module.exports.getProductsList = async (event) => {
    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };
  };
  
  module.exports.getProductsById = async (event) => {
    const productId = event.pathParameters.productId;
    const product = products.find(p => p.id == productId);
  
    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' })
      };
    }
  
    return {
      statusCode: 200,
      body: JSON.stringify(product)
    };
  };
  
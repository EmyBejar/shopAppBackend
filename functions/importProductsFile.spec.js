const AWSMock = require("aws-sdk-mock");
const functions_handlers = require("./handlers");
const { describe, afterEach } = require("node:test");
const chai = require('chai');
const expect = chai.expect;


describe("importProductFile Lambda function", () => {
  afterEach(() => {
    AWSMock.restore();
  });
});

it("Shoud return  a signed URL", async () => {
  const mockSignedUrl =
    "https://emmauploaded.s3.amazonaws.com";

  AWSMock.mock("S3", "getSignedUrlPromise", (operation, params, callback) => {
    expect(operation).to.equal("putObject");
    expect(params).to.deep.equal({
      Bucket: "emmauploaded",
      Key: "uploaded/test.csv",
      Expires: 3600,
      ContentType: "text/csv",
    });
    callback(null, mockSignedUrl);
  });

  const event = {
    queryStringParameters: {
      name: "test.csv",
    },
  };

  const response = await functions_handlers.importProductsFile(event);

  expect(response.statusCode).to.equal(200);
  expect(response.body).to.equal(JSON.stringify(mockSignedUrl));
});

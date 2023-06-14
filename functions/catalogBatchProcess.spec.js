const { catalogBatchProcess } = require("./handlers");
const AWSMock = require("aws-sdk-mock");

const AWS = require("aws-sdk");
const { beforeEach, afterEach } = require("node:test");

const snsMock = jest.fn().mockResolveValue({});
AWSMock.mock("SNS", "publish", snsMock);

const event = {
  Records: [
    { body: JSON.stringify({ id: "1", name: "Product 1" }) },
    { body: JSON.stringify({ id: "2", name: "Product 2" }) },
  ],
};

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  });

  afterEach(() => {
    AWSMock.restore();
  });

  it("should create products and publish to SNS", async () => {
    const result = await catalogBatchProcess(event);
    expect(result.statusCode).toBe(200);
    expect(snsPublishMock).toHaveBeenCalledWith({
      TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
      MessageStructure: "json",
      Message: "Products created successfully",
    });
  });

  it("should throw an error if there is an error processing the batch", async () => {
    const createProductMock = jest
      .fn()
      .mockRejectedValue(new Error("Error creating product"));
    jest.mock("./handlers", () => ({
      createProduct: createProductMock,
    }));

    await expect(catalogBatchProcess(event)).rejects.toThrow(
      "Error processing batch"
    );

    expect(snsPublishMock).not.toHaveBeenCalled();
  });
});

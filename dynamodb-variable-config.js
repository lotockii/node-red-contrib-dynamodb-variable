const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

module.exports = function (RED) {
    function DynamoDBConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name || "DynamoDB Config";
        this.region = config.region;
        this.accessKeyId = this.credentials.accessKeyId;
        this.secretAccessKey = this.credentials.secretAccessKey;

        this.getClient = () => {
            if (!this.client) {
                if (!this.accessKeyId || !this.secretAccessKey) {
                    throw new Error("AWS Credentials are missing in DynamoDB configuration.");
                }

                const dynamoClient = new DynamoDBClient({
                    region: this.region,
                    credentials: {
                        accessKeyId: this.accessKeyId,
                        secretAccessKey: this.secretAccessKey
                    }
                });

                this.client = DynamoDBDocumentClient.from(dynamoClient);
            }
            return this.client;
        };
    }

    RED.nodes.registerType("dynamodb-variable-config", DynamoDBConfigNode, {
        credentials: {
            accessKeyId: { type: "text" },
            secretAccessKey: { type: "text" }
        }
    });
};
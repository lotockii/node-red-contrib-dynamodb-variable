const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

module.exports = function (RED) {
    function DynamoDBConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name || "DynamoDB Config";
        this.region = config.region || process.env.AWS_REGION || "eu-central-1";
        this.accessKeyId = this.credentials.accessKeyId;
        this.secretAccessKey = this.credentials.secretAccessKey;

        this.getClient = () => {
            try {
                if (!this.client) {
                    if (!this.accessKeyId || !this.secretAccessKey) {
                        this.warn("AWS Credentials are missing, using IAM Role if available.");
                    }

                    const dynamoClient = new DynamoDBClient({
                        region: this.region,
                        credentials: this.accessKeyId && this.secretAccessKey ? {
                            accessKeyId: this.accessKeyId,
                            secretAccessKey: this.secretAccessKey
                        } : undefined
                    });

                    this.client = DynamoDBDocumentClient.from(dynamoClient);
                }
                return this.client;
            } catch (err) {
                this.error("Error initializing DynamoDB client: " + err.message, this);
                return null;
            }
        };
    }

    RED.nodes.registerType("dynamodb-variable-config", DynamoDBConfigNode, {
        credentials: {
            accessKeyId: { type: "text" },
            secretAccessKey: { type: "text" }
        }
    });
};
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { GetCommand, PutCommand, DeleteCommand, UpdateCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

module.exports = function (RED) {
    function DynamoDBNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const dbConfig = RED.nodes.getNode(config.awsConfig);

        if (!dbConfig) {
            node.error("DynamoDB configuration not found.");
            return;
        }

        const client = dbConfig.getClient();

        node.on('input', async (msg, send, done) => {
            try {
                let response;
                const tableName = msg.payload.tableName;
                const key = msg.payload.key;
                const data = msg.payload.data;
                const updateExpression = msg.payload.updateExpression;
                const expressionValues = msg.payload.expressionValues;
                const keyConditionExpression = msg.payload.keyConditionExpression;
                const expressionNames = msg.payload.expressionNames;

                switch (config.operation) {
                    case "createTable":
                        if (!tableName) throw new Error("Missing required parameter: tableName");

                        response = await client.send(new CreateTableCommand({
                            TableName: tableName,
                            KeySchema: msg.payload.keySchema,
                            AttributeDefinitions: msg.payload.keySchema.map(attr => ({
                                AttributeName: attr.AttributeName,
                                AttributeType: "S"
                            })),
                            ProvisionedThroughput: msg.payload.provisionedThroughput || {
                                ReadCapacityUnits: 5,
                                WriteCapacityUnits: 5
                            }
                        }));
                        msg.payload = { success: true, details: response };
                        break;

                    case "getItem":
                        if (!key) throw new Error("Missing required parameter: key");
                        response = await client.send(new GetCommand({ TableName: tableName, Key: key }));
                        msg.payload = response.Item || {};
                        break;

                    case "putItem":
                        if (!data) throw new Error("Missing required parameter: data");
                        await client.send(new PutCommand({ TableName: tableName, Item: data }));
                        msg.payload = { success: true };
                        break;

                    case "deleteItem":
                        if (!key) throw new Error("Missing required parameter: key");
                        await client.send(new DeleteCommand({ TableName: tableName, Key: key }));
                        msg.payload = { success: true };
                        break;

                    case "updateItem":
                        if (!tableName) throw new Error("Missing required parameter: tableName");
                        if (!key) throw new Error("Missing required parameter: key");
                        if (!updateExpression || !expressionValues) {
                            throw new Error("Missing required parameters for update operation");
                        }
                        response = await client.send(new UpdateCommand({
                            TableName: tableName,
                            Key: key,
                            UpdateExpression: updateExpression,
                            ExpressionAttributeValues: expressionValues,
                            ExpressionAttributeNames: msg.payload.expressionNames || {},
                            ReturnValues: "UPDATED_NEW"
                        }));
                        msg.payload = { success: true, updatedAttributes: response.Attributes };
                        break;

                    case "scan":
                        response = await client.send(new ScanCommand({ TableName: tableName }));
                        msg.payload = response.Items || [];
                        break;

                    case "query":
                        if (!tableName) throw new Error("Missing required parameter: tableName");
                        if (!keyConditionExpression || !expressionValues) {
                            throw new Error("Missing required parameters for query operation");
                        }

                        response = await client.send(new QueryCommand({
                            TableName: tableName,
                            KeyConditionExpression: keyConditionExpression,
                            ExpressionAttributeValues: expressionValues,
                            ExpressionAttributeNames: expressionNames || undefined
                        }));

                        msg.payload = response.Items || [];
                        break;

                    default:
                        throw new Error(`Unsupported operation: ${config.operation}`);
                }

                send(msg);
                done();
            } catch (err) {
                node.error(err.message, msg);
                msg.payload = { error: err.message };
                send(msg);
                done();
            }
        });
    }

    RED.nodes.registerType("dynamodb-variable", DynamoDBNode);
};
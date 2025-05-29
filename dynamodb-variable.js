const {
    DynamoDBClient,
    CreateTableCommand
} = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    DeleteCommand,
    UpdateCommand,
    ScanCommand,
    QueryCommand
} = require("@aws-sdk/lib-dynamodb");

module.exports = function (RED) {
    function DynamoDBNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const dbConfig = RED.nodes.getNode(config.awsConfig);

        if (!dbConfig) {
            node.error("DynamoDB configuration not found.");
            return;
        }

        node.on('input', async (msg, send, done) => {
            try {
                // Get client with message context for credential resolution
                const client = dbConfig.getClient(msg, node);
                
                if (!client) {
                    throw new Error("Failed to initialize DynamoDB client");
                }

                let response;
                const tableName = msg.payload.tableName;
                const key = msg.payload.key;
                const data = msg.payload.data;
                const updateExpression = msg.payload.updateExpression;
                const expressionValues = msg.payload.expressionValues;
                const keyConditionExpression = msg.payload.keyConditionExpression;
                const expressionNames = msg.payload.expressionNames;
                const gsiIndex = msg.payload.indexName; // Используем GSI
                const sortKey = msg.payload.sortKey; // Сортировка по RANGE ключу
                const billingMode = msg.payload.billingMode || "PAY_PER_REQUEST"; // Billing Mode
                const projectionExpression = msg.payload.projectionExpression; // Какие атрибуты возвращать
                const filterExpression = msg.payload.filterExpression; // Фильтрация данных при сканировании

                switch (config.operation) {
                    case "createTable":
                        if (!tableName) throw new Error("Missing required parameter: tableName");

                        const createParams = {
                            TableName: tableName,
                            KeySchema: msg.payload.keySchema,
                            AttributeDefinitions: msg.payload.attributeDefinitions,
                            BillingMode: billingMode,
                            ProvisionedThroughput: billingMode === "PROVISIONED" ? {
                                ReadCapacityUnits: 5,
                                WriteCapacityUnits: 5
                            } : undefined
                        };

                        if (msg.payload.globalSecondaryIndexes) {
                            createParams.GlobalSecondaryIndexes = msg.payload.globalSecondaryIndexes;
                        }

                        response = await client.send(new CreateTableCommand(createParams));

                        msg.payload = { success: true, details: response };
                        break;

                    case "getItem":
                        if (!key) throw new Error("Missing required parameter: key");
                        response = await client.send(new GetCommand({
                            TableName: tableName,
                            Key: key,
                            ProjectionExpression: projectionExpression // Выборка только нужных атрибутов
                        }));
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
                            ExpressionAttributeNames: expressionNames || {},
                            ReturnValues: "UPDATED_NEW"
                        }));
                        msg.payload = { success: true, updatedAttributes: response.Attributes };
                        break;

                    case "scan":
                        response = await client.send(new ScanCommand({
                            TableName: tableName,
                            ProjectionExpression: projectionExpression, // Выбор атрибутов
                            FilterExpression: filterExpression, // Фильтрация данных
                            ExpressionAttributeValues: expressionValues
                        }));
                        msg.payload = response.Items || [];
                        break;

                    case "query":
                        if (!tableName) throw new Error("Missing required parameter: tableName");
                        if (!keyConditionExpression || !expressionValues) {
                            throw new Error("Missing required parameters for query operation");
                        }

                        const queryParams = {
                            TableName: tableName,
                            KeyConditionExpression: keyConditionExpression,
                            ExpressionAttributeValues: expressionValues,
                            ExpressionAttributeNames: expressionNames || undefined,
                            ProjectionExpression: projectionExpression // Выбор конкретных полей
                        };

                        // Если указан индекс (GSI), добавляем в параметры
                        if (gsiIndex) {
                            queryParams.IndexName = gsiIndex;
                        }

                        // Если указан sortKey, добавляем в KeyConditionExpression
                        if (sortKey) {
                            queryParams.KeyConditionExpression += ` AND createdAt >= :sortKey`;
                            queryParams.ExpressionAttributeValues[":sortKey"] = sortKey;
                        }

                        response = await client.send(new QueryCommand(queryParams));
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
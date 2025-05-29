const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

module.exports = function (RED) {
    /**
     * Helper function to get value from different contexts
     * @param {Object} node - Node instance
     * @param {string} value - Value to get
     * @param {string} type - Type of value (str, flow, global, env)
     * @param {Object} msg - Message object
     * @returns {string} Retrieved value
     */
    function getValueFromContext(node, value, type, msg) {
        if (value === null || value === undefined) return null;

        try {
            let result;
            switch (type) {
                case 'flow':
                    const flowContext = node.context().flow;
                    if (!flowContext) {
                        return null;
                    }
                    result = getNestedValue(flowContext, value);
                    break;
                case 'global':
                    const globalContext = node.context().global;
                    if (!globalContext) {
                        return null;
                    }
                    result = getNestedValue(globalContext, value);
                    break;
                case 'env':
                    result = process.env[value];
                    break;
                case 'msg':
                    result = RED.util.getMessageProperty(msg, value);
                    break;
                default:
                    result = value;
            }

            return result !== undefined ? result : null;
        } catch (err) {
            throw new Error(`Failed to get value for type: ${type}, value: ${value}. Error: ${err.message}`);
        }
    }

    // Helper function to get nested values like "all_vars.host"
    function getNestedValue(context, path) {
        if (!context) return undefined;
        
        if (path.includes('.')) {
            const parts = path.split('.');
            let result = context.get(parts[0]);
            for (let i = 1; i < parts.length; i++) {
                if (result && typeof result === 'object') {
                    result = result[parts[i]];
                } else {
                    return undefined;
                }
            }
            return result;
        } else {
            return context.get(path);
        }
    }

    function DynamoDBConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name || "DynamoDB Config";
        this.region = config.region || process.env.AWS_REGION || "eu-central-1";
        
        // Store credential types and values
        this.useIAMRole = config.useIAMRole === true || config.useIAMRole === "true" || config.useIAMRole === 1;
        this.accessKeyIdType = config.accessKeyIdType || 'str';
        this.secretAccessKeyType = config.secretAccessKeyType || 'str';
        this.accessKeyId = config.accessKeyId;
        this.accessKeyIdContext = config.accessKeyIdContext;
        this.secretAccessKey = config.secretAccessKey;
        this.secretAccessKeyContext = config.secretAccessKeyContext;

        // Get credentials for string passwords
        const credentials = this.credentials || {};

        // Helper method to parse credential values
        this.parseCredentialValue = function(value, type, msg, executingNode) {
            if (!value) {
                return null;
            }
            
            try {
                let result;
                switch (type) {
                    case 'str':
                        result = value;
                        break;
                    case 'flow':
                        result = getValueFromContext(executingNode || this, value, 'flow', msg);
                        break;
                    case 'global':
                        result = getValueFromContext(executingNode || this, value, 'global', msg);
                        break;
                    case 'env':
                        result = process.env[value] || null;
                        break;
                    default:
                        result = value;
                }
                return result;
            } catch (error) {
                if (executingNode) {
                    executingNode.error(`Error parsing credential value: ${error.message}`);
                }
                return null;
            }
        };

        // Get credentials based on configuration
        this.getCredentials = function(msg, executingNode) {
            if (this.useIAMRole) {
                return {
                    useIAMRole: true,
                    region: this.region
                };
            }

            try {
                const accessKeyId = this.parseCredentialValue(this.accessKeyId, this.accessKeyIdType, msg, executingNode);
                const secretAccessKey = this.parseCredentialValue(this.secretAccessKeyContext, this.secretAccessKeyType, msg, executingNode);

                if (!accessKeyId || !secretAccessKey) {
                    throw new Error("Access Key and Secret Key are required when not using IAM");
                }

                return {
                    accessKeyId,
                    secretAccessKey,
                    region: this.region
                };
            } catch (err) {
                throw new Error(`Failed to get AWS credentials: ${err.message}`);
            }
        };

        this.getClient = (msg, executingNode) => {
            try {
                // Use IAM role if configured
                if (this.useIAMRole) {
                    const dynamoClient = new DynamoDBClient({
                        region: this.region
                    });
                    return DynamoDBDocumentClient.from(dynamoClient);
                }

                // Parse credentials based on their types
                let accessKeyId, secretAccessKey;

                // Handle Access Key ID
                if (this.accessKeyIdType === 'str') {
                    // String type - get from credentials
                    accessKeyId = this.credentials?.accessKeyId;
                } else {
                    // Context type - resolve from stored variable name
                    accessKeyId = this.parseCredentialValue(this.accessKeyIdContext, this.accessKeyIdType, msg, executingNode);
                }

                // Handle Secret Access Key (PostgreSQL-like logic)
                if (this.secretAccessKeyType === 'str') {
                    // String type - get from credentials
                    secretAccessKey = this.credentials?.secretAccessKey;
                } else {
                    // Context type - resolve from stored variable name
                    secretAccessKey = this.parseCredentialValue(this.secretAccessKeyContext, this.secretAccessKeyType, msg, executingNode);
                }

                // Validate credentials
                if (!accessKeyId || !secretAccessKey) {
                    const missingFields = [];
                    if (!accessKeyId) missingFields.push('Access Key ID');
                    if (!secretAccessKey) missingFields.push('Secret Access Key');
                    throw new Error(`Missing required credentials: ${missingFields.join(', ')}`);
                }

                // Create DynamoDB client with credentials
                const dynamoClient = new DynamoDBClient({
                    region: this.region,
                    credentials: {
                        accessKeyId: accessKeyId,
                        secretAccessKey: secretAccessKey
                    }
                });
                return DynamoDBDocumentClient.from(dynamoClient);

            } catch (error) {
                if (executingNode) {
                    executingNode.error(`Failed to create DynamoDB client: ${error.message}`);
                }
                throw error;
            }
        };
    }

    RED.nodes.registerType("dynamodb-variable-config", DynamoDBConfigNode, {
        credentials: {
            accessKeyId: { type: "text" },
            secretAccessKey: { type: "password" }
        },
        defaults: {
            name: { value: "" },
            region: { value: "eu-central-1", required: true },
            useIAMRole: { value: false, required: true },
            accessKeyId: { value: "" },
            accessKeyIdType: { value: "str" },
            accessKeyIdContext: { value: "" },
            secretAccessKey: { value: "" },
            secretAccessKeyType: { value: "str" },
            secretAccessKeyContext: { value: "" }
        }
    });
};
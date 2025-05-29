# node-red-contrib-dynamodb-variable

A [Node-RED](http://nodered.org) node for interacting with [AWS DynamoDB](https://aws.amazon.com/dynamodb/).

**Developed by Andrii Lototskyi**

## 📌 Install

Run the following command in the root directory of your Node-RED installation:

```sh
npm install node-red-contrib-dynamodb-variable
```

This module allows performing CRUD operations and table management on DynamoDB using Node-RED.

---

## 📌 Set AWS Credentials

Before using this module, configure AWS credentials **inside the DynamoDB Config Node in Node-RED**:

- **AWS Access Key ID**
- **AWS Secret Access Key**
- **AWS Region** (e.g., `us-east-1`)

These credentials are required for authentication with AWS DynamoDB.

#### Credential Sources
All connection parameters support multiple input types:
- **String**: Direct value stored securely in Node-RED credentials
- **Flow Context**: Retrieved from flow context variables
- **Global Context**: Retrieved from global context variables
- **Environment Variable**: Retrieved from environment variables

---

## 📌 Available Operations

The **DynamoDB Node** supports the following operations:

1️⃣ **Create a Table (`createTable`)**  
2️⃣ **Get an item (`getItem`)**  
3️⃣ **Put an item (`putItem`)**  
4️⃣ **Update an item (`updateItem`)**  
5️⃣ **Delete an item (`deleteItem`)**  
6️⃣ **Scan a table (`scan`)**  
7️⃣ **Query a table (`query`)**

Each operation is selected in the **DynamoDB Node** via the dropdown menu.

---

## 📌 Example Usage in Node-RED

### **1️⃣ Create a new DynamoDB Table**
You can create a table with **Primary Key**, **Sort Key (optional)**, and **Global Secondary Index (GSI)**.

```js
msg.payload = {
    "tableName": "Transactions",
    "keySchema": [
        { "AttributeName": "userId", "KeyType": "HASH" },
        { "AttributeName": "createdAt", "KeyType": "RANGE" }
    ],
    "attributeDefinitions": [
        { "AttributeName": "userId", "AttributeType": "S" },
        { "AttributeName": "createdAt", "AttributeType": "N" }
    ],
    "billingMode": "PAY_PER_REQUEST" // OR "PROVISIONED"
};
return msg;
```

---

### **2️⃣ Get an item from DynamoDB**
```js
msg.payload = {
    "tableName": "Users",
    "key": { "userId": "12345" }
};
return msg;
```

---

### **3️⃣ Put an item into DynamoDB**
```js
msg.payload = {
    "tableName": "Users",
    "data": {
        "userId": "12345",
        "name": "John Doe",
        "email": "john@example.com"
    }
};
return msg;
```

---

### **4️⃣ Update an item in DynamoDB**
```js
msg.payload = {
    "tableName": "Users",
    "key": { "userId": "12345" },
    "updateExpression": "SET email = :email",
    "expressionValues": { ":email": "newemail@example.com" }
};
return msg;
```

---

### **5️⃣ Delete an item from DynamoDB**
```js
msg.payload = {
    "tableName": "Users",
    "key": { "userId": "12345" }
};
return msg;
```

---

### **6️⃣ Scan a DynamoDB table**
```js
msg.payload = {
    "tableName": "Users",
    "filterExpression": "contains(name, :namePart)",
    "expressionValues": { ":namePart": "John" }
};
return msg;
```

---

### **7️⃣ Query a DynamoDB table (with Sort Key and GSI support)**
```js
msg.payload = {
    "tableName": "Transactions",
    "indexName": "TransactionIndex",
    "keyConditionExpression": "userId = :userId AND createdAt >= :startDate",
    "expressionValues": {
        ":userId": "user_123",
        ":startDate": 1700000000
    },
    "projectionExpression": "userId, amount, createdAt"
};
return msg;
```
☝ **This will retrieve all transactions for `user_123`, filtering those created after timestamp `1700000000`**.

---

## 📌 Features & Improvements
✅ **Supports all CRUD operations in DynamoDB**  
✅ **Table creation with HASH key, RANGE key, and GSI support**  
✅ **Billing Mode (`PAY_PER_REQUEST` or `PROVISIONED`) is configurable**  
✅ **AWS SDK v3 with `@aws-sdk/lib-dynamodb` for automatic data conversion**  
✅ **Projection and filter expressions for more optimized queries**  
✅ **Supports Global Secondary Index (GSI) and Sorting**  
✅ **Configured directly via Node-RED UI (no settings.js required)**  
✅ **Easy to configure and extend**

---

## 📌 Support & Issues
If you find any issues, please report them at:  
[GitHub Issues](https://github.com/lotockii/node-red-contrib-dynamodb-variable/issues)

---

## 📌 Author & License

- **Author**: Andrii Lototskyi
- **License**: ISC
- **Repository**: [GitHub](https://github.com/lotockii/node-red-contrib-dynamodb-variable)

🚀 **Happy coding with Node-RED & AWS DynamoDB!** 🎉
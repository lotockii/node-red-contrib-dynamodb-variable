# node-red-contrib-dynamodb-variable

A [Node-RED](http://nodered.org) node for interacting with [AWS DynamoDB](https://aws.amazon.com/dynamodb/).

**Developed by Andrii Lototskyi**

## 📌 Install

Run the following command in the root directory of your Node-RED installation:

```sh
npm install node-red-contrib-dynamodb-variable
```

This module allows performing CRUD operations on DynamoDB tables using Node-RED.

---

## 📌 Set AWS Credentials

Before using this module, configure AWS credentials **inside the DynamoDB Config Node in Node-RED**:

- **AWS Access Key ID**
- **AWS Secret Access Key**
- **AWS Region** (e.g., `us-east-1`)

These credentials are required for authentication with AWS DynamoDB.

---

## 📌 Available Operations

The **DynamoDB Node** supports the following operations:

1️⃣ **Get an item (`getItem`)**  
2️⃣ **Put an item (`putItem`)**  
3️⃣ **Update an item (`updateItem`)**  
4️⃣ **Delete an item (`deleteItem`)**  
5️⃣ **Scan a table (`scan`)**  
6️⃣ **Query a table (`query`)**

Each operation is selected in the **DynamoDB Node** via the dropdown menu.

---

## 📌 Example Usage in Node-RED

### **1️⃣ Get an item from DynamoDB**
Set this in a **function node** before connecting to the DynamoDB node:

```js
msg.payload = {
    tableName: "Users",
    key: { userId: "12345" }
};
return msg;
```

---

### **2️⃣ Put an item into DynamoDB**
```js
msg.payload = {
    tableName: "Users",
    data: {
        userId: "12345",
        name: "John Doe",
        email: "john@example.com"
    }
};
return msg;
```

---

### **3️⃣ Update an item in DynamoDB**
```js
msg.payload = {
    tableName: "Users",
    key: { userId: "12345" },
    updateExpression: "SET email = :email",
    expressionValues: { ":email": "newemail@example.com" }
};
return msg;
```

---

### **4️⃣ Delete an item from DynamoDB**
```js
msg.payload = {
    tableName: "Users",
    key: { userId: "12345" }
};
return msg;
```

---

### **5️⃣ Scan a DynamoDB table**
```js
msg.payload = {
    tableName: "Users"
};
return msg;
```

---

### **6️⃣ Query a DynamoDB table**
```js
msg.payload = {
    tableName: "Users",
    keyConditionExpression: "userId = :userId",
    expressionValues: { ":userId": "12345" }
};
return msg;
```

---

## 📌 Example Node-RED Flow

Import the flow below into an **empty sheet** in Node-RED:

```json
[
    {
        "id": "35c76478.e1723c",
        "type": "function",
        "z": "25b7c5b4.6f1eba",
        "name": "Set Query Parameters",
        "func": "msg.payload = {\n    tableName: \"Users\",\n    key: { userId: \"12345\" }\n};\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 273,
        "y": 96,
        "wires": [["740c574e.518e28"]]
    }
]
```

---

## 📌 Summary
✅ **Supports all CRUD operations in DynamoDB**  
✅ **Uses AWS SDK v3**  
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


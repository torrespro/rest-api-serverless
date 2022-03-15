const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.update({
    endpoint: "https://dynamodb.us-east-1.amazonaws.com",
    region: "us-east-1"
});

const docClient = new AWS.DynamoDB.DocumentClient();
// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

// This is a DB simulation. Data should be managed with a real database inside functions.

const getAll = (type) => {
    const params = {
        TableName: tableName,
        IndexName: "typeGsi",
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#ty": 'type'
        },
        KeyConditionExpression: "#ty = :type",
        ExpressionAttributeValues:{
            ":type": type
        }
    };

    return docClient.query(params).promise();
};

const addUser = (data) => {
    const params = {
        TableName: tableName,
        Item: {
            "id": uuid.v1(),
            "type": "user",
            "name": data.name,
            "email": data.email,
        }
    };

    return docClient.put(params).promise();
};

const updateUser = (data) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": data.userid,
            "type": "user"
        },
        UpdateExpression: "set #na = :n, email = :e",
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#na": 'name'
        },
        ExpressionAttributeValues: {
            ":n": data.name,
            ":e": data.email
        },
        ReturnValues: "UPDATED_OLD" // Returns the item content before it was updated
    };

    return docClient.update(params).promise();
};

const deleteUser = (userid) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": userid,
            "type": "user"
        },
        ReturnValues: "ALL_OLD" // Returns the item content before it was deleted
    };

    return docClient.delete(params).promise();
};

const getBookComments = (id, type) => {
    const params = {
        TableName : tableName,
        IndexName: "bookIdGsi",
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#ty": 'type'
        },
        KeyConditionExpression: "#ty = :type AND bookId = :bookId",
        ExpressionAttributeValues:{
            ":type": type,
            ":bookId": id
        }
    };

    return docClient.query(params).promise();
};

const getUserComments = (id, type) => {
    const params = {
        TableName : tableName,
        IndexName: "userIdGsi",
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#ty": 'type'
        },
        KeyConditionExpression: "#ty = :type AND userId = :userId",
        ExpressionAttributeValues:{
            ":type": type,
            ":userId": id
        }
    };

    return docClient.query(params).promise();
};

const getBookById = (id) => {
    var params = {
        TableName : tableName,
        Key: { id: id, type: 'book' },
    };
    return docClient.get(params).promise();
};

const addBook = (data) => {
    const params = {
        TableName: tableName,
        Item: {
            "id": uuid.v1(),
            "type": "book",
            "title": data.title,
            "summary": data.summary,
            "author": data.author,
            "publisher": data.publisher,
            "publicationYear": data.publicationYear,
        }
    };

    return docClient.put(params).promise();
};

const updateBook = (data) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": data.bookid,
            "type": "book"
        },
        UpdateExpression: "set title = :t, summary = :s, author = :a, publisher = :p, publicationYear = :y",
        ExpressionAttributeValues: {
            ":t": data.title,
            ":s": data.summary,
            ":a": data.author,
            ":p": data.publisher,
            ":y": data.publicationYear
        },
        ReturnValues: "UPDATED_OLD" // Returns the item content before it was updated
    };

    return docClient.update(params).promise();
};

const deleteBook = (bookid) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": bookid,
            "type": "book"
        },
        ReturnValues: "ALL_OLD" // Returns the item content before it was deleted
    };

    return docClient.delete(params).promise();
};

const addComment = (data) => {
    const params = {
        TableName: tableName,
        Item: {
            "id": uuid.v1(),
            "type": "comment",
            "text": data.text,
            "rating": data.rating,
            "bookId": data.bookId,
            "userId": data.userId
        }
    };

    return docClient.put(params).promise();
};

const updateComment = (data) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": data.commentid,
            "type": "comment"
        },
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#tx": 'text'
        },
        UpdateExpression: "set #tx = :t, rating = :r",
        ExpressionAttributeValues: {
            ":t": data.text,
            ":r": data.rating
        },
        ReturnValues: "UPDATED_OLD" // Returns the item content before it was updated
    };

    return docClient.update(params).promise();
};

const deleteComment = (commentid) => {
    const params = {
        TableName: tableName,
        Key: {
            "id": commentid,
            "type": "comment"
        },
        ReturnValues: "ALL_OLD" // Returns the item content before it was deleted
    };

    return docClient.delete(params).promise();
};

module.exports = {
    getAll,
    addUser,
    updateUser,
    deleteUser,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
    getBookComments,
    getUserComments,
    addComment,
    updateComment,
    deleteComment
};

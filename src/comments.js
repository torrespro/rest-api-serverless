'use strict';

const dbManager = require('./bookStoreRepository');

exports.commentsHandler = (event, context, callback) => {
    switch (event.httpMethod) {
        case 'GET':
            getAllComments(callback);
            break;
        case 'POST':
            addComment(event.body, callback);
            break;
        case 'PUT':
            updateComment(event.pathParameters.commentid, event.body, callback);
            break;
        case 'DELETE':
            deleteComment(event.pathParameters.commentid, callback);
            break;
        default:
            sendResponse(400, `Unsupported method ${event.httpMethod}`, callback);
    }
};

const getAllComments = (callback) => {
    dbManager.getAll("comment")
    .then((res) => {
        sendResponse(200, res.Items, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const addComment = (data, callback) => {
    data = JSON.parse(data);

    dbManager.addComment(data)
    .then((res) => {
        sendResponse(201, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const updateComment = (commentid, data, callback) => {
    data = JSON.parse(data);
    data.commentid = commentid;

    dbManager.updateComment(data)
    .then((res) => {
        sendResponse(200, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const deleteComment = (commentid, callback) => {
    dbManager.deleteComment(commentid)
    .then((res) => {
        sendResponse(200, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const sendResponse = (statusCode, message, callback) => {
    const res = {
        statusCode: statusCode,
        body: JSON.stringify(message)
    };
    callback(null, res);
};

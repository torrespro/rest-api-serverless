'use strict';

const dbManager = require('./bookStoreRepository');

exports.usersHandler = (event, context, callback) => {

    // All log statements are written to CloudWatch
    console.info('received:', event);

    switch (event.httpMethod) {
        case 'GET':
            if (!event.pathParameters){
                getAllUsers(callback);
            }
            else
            {
                getCommentsByUser(event.pathParameters.userid, callback)
            }
            break;
        case 'POST':
            addUser(event.body, callback);
            break;
        case 'PUT':
            updateUser(event.pathParameters.userid, event.body, callback);
            break;
        case 'DELETE':
            deleteUser(event.pathParameters.userid, callback);
            break;
        default:
            sendResponse(400, `Unsupported method ${event.httpMethod}`, callback);
    }
};

const getAllUsers = (callback) => {
    dbManager.getAll("user")
    .then((res) => {
        sendResponse(200, res.Items, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const getCommentsByUser = (userid, callback) => {
    dbManager.getUserComments(userid,"comment")
    .then((res) => {
        sendResponse(200, res.Items, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const addUser = (data, callback) => {
    data = JSON.parse(data);

    dbManager.addUser(data)
    .then((res) => {
        sendResponse(201, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const updateUser = (userid, data, callback) => {
    data = JSON.parse(data);
    data.userid = userid;

    dbManager.updateUser(data)
    .then((res) => {
        sendResponse(200, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const deleteUser = (userid, callback) => {
    dbManager.getUserComments(userid)
    .then((res) => {
        if (!res.Items) {
            dbManager.deleteUser(userid)
            .then((res) => {
                sendResponse(200, res, callback);
            })
            .catch((err) => {
                console.log(err);
                sendResponse(err.http_code, err, callback);
            });
        }
        else {
            sendResponse(400, "Can't delete users with comments", callback);
        }
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

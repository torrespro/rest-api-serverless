'use strict';

const dbManager = require('./bookStoreRepository');

exports.booksHandler = (event, context, callback) => {
    switch (event.httpMethod) {
        case 'GET':
            if (!event.pathParameters){
                getAll(callback);
            }
            else
            {
                getById(event.pathParameters.bookid, callback)
            }
            break;
        case 'POST':
            addBook(event.body, callback);
            break;
        case 'PUT':
            updateBook(event.pathParameters.bookid, event.body, callback);
            break;
        case 'DELETE':
            deleteBook(event.pathParameters.bookid, callback);
            break;
        default:
            sendResponse(400, `Unsupported method ${event.httpMethod}`, callback);
    }
};

const getAll = (callback) => {
    dbManager.getAll("book")
    .then((res) => {
        var result = res.Items.map(book => {
            return {
                id: book.id,
                title: book.title,
            };
        });
        sendResponse(200, result, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const getById = (bookid, callback) => {
    dbManager.getBookById(bookid)
    .then((res) => {
        const body = res.Item;
        dbManager.getBookComments(bookid, "comment")
        .then((res) => {
            const items = res.Items;
            body.comments = items;
            sendResponse(200, body, callback);
        })
        .catch((err) => {
            console.log(err);
            sendResponse(err.http_code, err, callback);
        });
    })
};

const addBook = (data, callback) => {
    data = JSON.parse(data);

    dbManager.addBook(data)
    .then((res) => {
        sendResponse(201, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const updateBook = (bookid, data, callback) => {
    data = JSON.parse(data);
    data.bookid = bookid;

    dbManager.updateBook(data)
    .then((res) => {
        sendResponse(200, res, callback);
    })
    .catch((err) => {
        console.log(err);
        sendResponse(err.http_code, err, callback);
    });
};

const deleteBook = (bookid, callback) => {
    dbManager.deleteBook(bookid)
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

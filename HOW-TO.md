### Requirements
- **Nodejs** [Download](https://nodejs.org/es/download/)
- A REST consumer app like **POSTMAN** [Download](https://www.getpostman.com/downloads/)
- **AWS SAM CLI** (You will need to have an **AWS account**). Follow these instructions to install it from the official docs: [Instructions](https://docs.aws.amazon.com/es_es/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- **AWS SDK for Javascript** Follow this two [Installation](https://aws.amazon.com/es/sdk-for-node-js/) steps to install it.

### Installation
#### AWS + Dynamodb app installation
1. Go to [AWS](https://aws.amazon.com), and in the search box, input **IAM**. In this section (we need an IAM administrator user, but that should be done if you did the AWS SAM CLI config), we'll go to **Users**, and select the user you configured your AWS SAM CLI to work with. Click on it, and add the permission policie **AmazonDynamoDBFullAccess**. This is all we need from AWS for now.
2.
3. **Create an AWS S3 bucket** in your desired region and give it a name:

    ```
    aws s3api create-bucket --bucket your-bucket-name --create-bucket-configuration LocationConstraint=eu-west-3
    ```

4. **Package the project** writing this:

    ```
    sam package --template-file template.yaml --s3-bucket your-bucket-name --output-template-file packaged-template.yaml
    ```

5. **Deploy the app** to generate automatically all the needed resources:

    ```
    sam deploy --template-file packaged-template.yaml --stack-name your-stack-name --capabilities CAPABILITY_IAM
    ```

6. Once you have deployed the app, you should have your endpoints in [Amazon API Gateway](console.aws.amazon.com/apigateway). There, you need to **select your stack (your-stack-name) -> Stages -> Prod**. There, get the **Invoke URL** (you will need it to make the requests).
7. But the important thing in this section is [DynamoDB](console.aws.amazon.com/dynamodb). Being there, press on **Tables**. You should see a table named **entity**.
8. The installation is done!

### Use

With the **Invoke URL**, we will be able use our DynamoDB queries in the background. Here, you can see the endpoints to the API created in the lambda function:

#### (Example) invoke_url = https://xxxxx.execute-api.eu-west-3.amazonaws.com/Prod



### DynamoDB + AWS
DynamoDB has a **special namespacing-level**, different from the common approach. Usually, we can have many different database names, which each one could have tables/collections, and so on, but in DynamoDB, it works a little bit different. If you want, for example, have a different "database" with its own tables for different applications, you could do it following the [aws-region > aws-account-id > ] table form. That means that we could have, for example, another separated database if we use a different aws-account-id, or even the same account but in a different region.

Keeping the information above in mind, the way we should understand this kind of database, is the same. In our database, we have tables (just one this time, called **users**). And in each table, we have something called **Items**, that are, in fact, documents with a Json shape.

One noticeable thing in the **SAM template**, we only specified our primary key (userid). That's because when the first object is added to the table, it creates the rest of columns.

Another important thing is that DynamoDB **doesn't generate a generic id** for each Item by itself. We must take care of it, for example, using the package **uuid**, which allows us to create unique ids from different methods. We used **uuid.v1()**, that generates a hashed id having the date and time into account. This will avoid the userid's to collide.

To work with a DynamoDB client from our app we needed to give some policies to our lambda:

```yaml
            Policies:
              # Give Create/Read/Update/Delete Permissions to the SampleTable
              - DynamoDBCrudPolicy:
                  TableName: !Ref bookStoreTable
```

You can imagine what it does. This policie, will allow our lambda to scan (used to get all the data from a table), delete, get, put and update in the table users, that is the resource url indicated at the end.

Also, to work with the database from our app code, we imported **aws-sdk**, which is perfect to create all kind of queries between our app and the database. It also needs to be configured, but it's really easy:

```javascript
const AWS = require('aws-sdk');

AWS.config.update({
    endpoint: "https://dynamodb.eu-west-3.amazonaws.com"
});
```

With the code above, our app will know which database we are working with. But, we also need to initialize an object, which will be the client:

```javascript
const docClient = new AWS.DynamoDB.DocumentClient();
```

The object we created (docClient), has the typical different queries:
- **scan(params, callback)**: This is used to get all the Items from a table. As much as the table gets very large, it will be become a **not very efficient** operation. For example:

```javascript
const getAllUsers = () => {
    const params = {
        TableName: table
    };

    return docClient.scan(params).promise();
};
```

- **put(params, callback)**: This method seems a bit tricky by its name (could be understood as an update, which is not its purpose), but it is just a method to **create a new Item** in our table:

```javascript
const addUser = (data) => {
    const params = {
        TableName: table,
        Item: {
            "userid": uuid.v1(),
            "name": data.name,
            "email": data.email,
            "age": data.age
        }
    };

    return docClient.put(params).promise();
};
```

- **update(params, callback)**: Of course, it is also possible to update an Item/Items. This needs more attributes in the params, to indicate which object and which fields we want to update:

```javascript
const updateUser = (data) => {
    const params = {
        TableName: table,
        Key: {
            "userid": data.userid
        },
        UpdateExpression: "set #na = :n, email = :e, age = :a",
        ExpressionAttributeNames: { // Used when there are reserved words in DynamoDB, like name
            "#na": 'name'
        },
        ExpressionAttributeValues: {
            ":n": data.name,
            ":e": data.email,
            ":a": data.age
        },
        ReturnValues: "ALL_OLD" // Returns the item content before it was updated
    };

    return docClient.update(params).promise();
};
```

In the attribute **UpdateExpression**, you can see we have some extrange things, for example, the **#na** and the **:e**. The first one (#na), is an ExpressionAttributeName. It is necessary because the word "name" is reserved in DynamoDB, and this way, we can let it know that we are not meaning the reserved one. In the other hand, we have the ExpressionAttributeValue (:e). This is just a way to tell that we will insert its value later, in the field called **ExpressionAttributeValues** as a key-value pair.
We can also customize the return value after updating the row, using the **ReturnValues** attribute.

- **delete(params, callback)**: We can use this method to delete an object/objects. This method needs a condition, to search the objects we want to delete, and give values to the condition in the **ExpressionAttributeValues**. The **ReturnValues** is also optional and we used it to return the deleted value:

```javascript
const deleteUser = (userid) => {
    const params = {
        TableName: table,
        Key: {
            "userid": userid
        },
        ConditionExpression: "userid = :userid",
        ExpressionAttributeValues: {
            ":userid": userid
        },
        ReturnValues: "ALL_OLD" // Returns the item content before it was deleted
    };

    return docClient.delete(params).promise();
};
```

### Summary
DynamoDB has **secondary indexes** that can help to search during the execution of a query, if the main index is not present.

The **deployment is painless**. But if you are working with AWS, it's highly recommended to use DynamoDB, because it has a lot of features that can be used among other AWS Services.

One thing that developers must pay attention to, is that if you don't select a good key scheme, **DynamoDB costs could increase relatively easy**. It's a good idea to follow DynamoDB's good patterns. On the other hand, if more **performance is needed**, it will scale without any problems.

Speaking about the **size of documents/items**, in **DynamoDB**, a Item can only have **400KB** as much.

Also, **DynamoDB, depends more on AWS's ecosystem**. It's less universal.

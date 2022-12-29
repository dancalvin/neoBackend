## Steps to adding a new Query/Mutation

### Step 1

#### Add your relevant query/mutation inside the block as shown.

#### For input parameter please use the parameter **input** and the input and return type should also follow the same pattern

<br/>

**NOTE**: Please run **_npm run codegen_** after adding your query/mutation inside **schema.graphql**

```
    type Query {
        getUser(input: GetUserInput!): User!
    }

    input GetUserInput {
        username: String!
    }

    type User {
        # all user propertues name, bio....
    }
```

### Step 2

#### Navigate to **social_media-stack.ts** and add a similar codesnippet changing the variable names and typename (Query/Mutation) based on your assigned API. Try to follow the folder structure when creating lambda function file

```
    const getUserLambda = new lambda.Function(this, "getUserLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      // Enter the correct path to your function file
      code: lambda.Code.fromAsset("functions/api/User/get"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [lambdaLayer],
    });
    socialMediaTable.grantFullAccess(getUserLambda);
    getUserLambda.addEnvironment("TABLE_NAME", socialMediaTable.tableName);

    const getUserLambdaDataSource = socialMediaApi.addLambdaDataSource(
      "getUserLambdaDataSource",
      getUserLambda
    );
    getUserLambdaDataSource.createResolver("getUserResolver", {
      // This can also be Mutation based on your API
      typeName: "Query",
      fieldName: "getUser",
    });
```

### Step 3

Create your function file inside functions directory and add your relavant logic

```
import AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { GetUserInput } from "../../../../types/graphql";
import { User as UserType } from "../../../entities/User";
const _User = require("/opt/User");
const User = _User.User as typeof UserType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: GetUserInput;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  console.log(event);
  const input = event.arguments.input;

  const params = {
    TableName: process.env.TABLE_NAME!,
    Key: {
      PK: `USER#${input.username}`,
      SK: `METADATA#${input.username}`,
    },
  };
  try {
    const result = await dynamodb.get(params).promise();

    const user = User.fromItem(result.Item);
    console.log("User => ", result.Item);

    return {
      username: user.username,
      email: user.email,
      birthDate: user.birthDate,
      age: user.age,
      fullName: user.fullName,
      address: user.address,
      profilePicture: user.profilePicture,
      bio: user.bio,
      numOfFollowers: user.numOfFollowers,
    };
  } catch (error) {
    console.log("Error => ", error);
    const err: any = error;
    console.log("Error From Fetching User => ", err);

    let errorMessage = "Could not fetch User";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "User Condition checking error";
    }

    throw new Error(errorMessage);
  }
};
```

### Step 4 (Deploy to AWS)

Commands to run

- npm run build

**NOTE:** If you have configured the access keys provided as default

- cdk deploy

**Otherwise**

- cdk deploy --profile YOUR_USER_NAME

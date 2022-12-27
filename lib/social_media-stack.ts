import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "@aws-cdk/aws-appsync-alpha";

export class SocialMediaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * NoSql single table design database to store all the data
     */
    const socialMediaTable = new dynamodb.Table(this, "SocialMediaTable", {
      tableName: "SocialMedia",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    socialMediaTable.addGlobalSecondaryIndex({
      indexName: "GSIInvertedIndex",
      partitionKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
    });

    /**
     * Store all the flagged posts, comments and users
     */
    const flagContentTable = new dynamodb.Table(this, "FlaggedContentTable", {
      tableName: "FlaggedContent",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPool = new cognito.UserPool(this, "SocialMediaUserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
        birthdate: {
          required: false,
          mutable: true,
        },
        address: {
          required: false,
          mutable: true,
        },
        profilePicture: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        bio: new cognito.StringAttribute({
          mutable: true,
        }),
        age: new cognito.NumberAttribute({
          mutable: true,
        }),
      },
    });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "SocialMediaUserPoolClient",
      {
        userPool,
      }
    );

    const socialMediaApi = new appsync.GraphqlApi(this, "SocialMediaApi", {
      name: "SocialMediaApi",
      schema: appsync.SchemaFile.fromAsset("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: cdk.Expiration.after(cdk.Duration.days(30)),
            },
          },
        ],
      },
    });

    const lambdaLayer = new lambda.LayerVersion(this, "LambdaLayer", {
      code: lambda.Code.fromAsset("functions/entities"),
    });

    // User
    const createUserLambda = new lambda.Function(this, "createUserLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions/api/User/create"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [lambdaLayer],
    });
    socialMediaTable.grantFullAccess(createUserLambda);
    createUserLambda.addEnvironment("TABLE_NAME", socialMediaTable.tableName);
    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      createUserLambda
    );

    const getUserLambda = new lambda.Function(this, "getUserLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
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
      typeName: "Query",
      fieldName: "getUser",
    });

    // Post
    const createPostLambda = new lambda.Function(this, "createPostLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions/api/Post/create"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [lambdaLayer],
    });
    socialMediaTable.grantFullAccess(createPostLambda);
    createPostLambda.addEnvironment("TABLE_NAME", socialMediaTable.tableName);

    const createPostLambdaDataSource = socialMediaApi.addLambdaDataSource(
      "createPostLambdaDataSource",
      createPostLambda
    );
    createPostLambdaDataSource.createResolver("createPostResolver", {
      typeName: "Mutation",
      fieldName: "createPost",
    });

    const getUserPostsLambda = new lambda.Function(this, "getUserPostsLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions/api/Post/get"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [lambdaLayer],
    });
    socialMediaTable.grantFullAccess(getUserPostsLambda);
    getUserPostsLambda.addEnvironment("TABLE_NAME", socialMediaTable.tableName);

    const getUserPostsLambdaDataSource = socialMediaApi.addLambdaDataSource(
      "getUserPostsLambdaDataSource",
      getUserPostsLambda
    );
    getUserPostsLambdaDataSource.createResolver("getUserPostsResolver", {
      typeName: "Query",
      fieldName: "getUserPosts",
    });

    const getFriendPostsLambda = new lambda.Function(
      this,
      "getFriendPostsLambda",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset("functions/api/Post/newsfeed"),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(10),
        layers: [lambdaLayer],
      }
    );
    socialMediaTable.grantFullAccess(getFriendPostsLambda);
    getFriendPostsLambda.addEnvironment(
      "TABLE_NAME",
      socialMediaTable.tableName
    );

    const getFriendPostsLambdaDataSource = socialMediaApi.addLambdaDataSource(
      "getFriendPostsLambdaDataSource",
      getFriendPostsLambda
    );
    getFriendPostsLambdaDataSource.createResolver("getFriendPostsResolver", {
      typeName: "Query",
      fieldName: "getFriendPosts",
    });

    // Follow
    const followUserLambda = new lambda.Function(this, "followUserLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions/api/User/follow"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [lambdaLayer],
    });
    socialMediaTable.grantFullAccess(followUserLambda);
    followUserLambda.addEnvironment("TABLE_NAME", socialMediaTable.tableName);

    const followUserLambdaDataSource = socialMediaApi.addLambdaDataSource(
      "followUserLambdaDataSource",
      followUserLambda
    );
    followUserLambdaDataSource.createResolver("followUserResolver", {
      typeName: "Mutation",
      fieldName: "followUser",
    });
  }
}

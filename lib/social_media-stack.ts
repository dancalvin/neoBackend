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

    // const socialMediaApi = new appsync.GraphqlApi(this, "SocialMediaApi", {
    //   name: "SocialMediaApi",
    //   schema: appsync.SchemaFile.fromAsset("graphql/schema.graphql"),
    //   authorizationConfig: {
    //     defaultAuthorization: {
    //       authorizationType: appsync.AuthorizationType.USER_POOL,
    //       userPoolConfig: { userPool },
    //     },
    //     additionalAuthorizationModes: [
    //       {
    //         authorizationType: appsync.AuthorizationType.API_KEY,
    //         apiKeyConfig: {
    //           expires: cdk.Expiration.after(cdk.Duration.days(30)),
    //         },
    //       },
    //     ],
    //   },
    // });

    const lambdaLayer = new lambda.LayerVersion(this, "LambdaLayer", {
      code: lambda.Code.fromAsset("functions/entities"),
    });

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
  }
}

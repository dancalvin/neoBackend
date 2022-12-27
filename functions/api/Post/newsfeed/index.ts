import AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { Post as PostType } from "../../../entities/Post";
const _Post = require("/opt/Post");
const Post = _Post.Post as typeof PostType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    username: string;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const params = {
    TableName: process.env.TABLE_NAME!,
    ScanIndexForward: false,
    KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK",
    },
    ExpressionAttributeValues: {
      ":PK": `USER#${event.arguments.username}`,
      ":SK": `FRIEND`,
    },
  };
  try {
    const result = await dynamodb.query(params).promise();
    console.log("Friends => ", result.Items);

    // You can limit the number of friends and posts for each friend
    const friendPosts = [];
    for (const item of result.Items!) {
      const params = {
        TableName: process.env.TABLE_NAME!,
        ScanIndexForward: false,
        KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
        ExpressionAttributeNames: {
          "#PK": "PK",
          "#SK": "SK",
        },
        ExpressionAttributeValues: {
          ":PK": `USER#${item.Following}`,
          ":SK": `POST`,
        },
      };
      const result = await dynamodb.query(params).promise();
      const posts: any = result.Items?.map((item: any) => Post.fromItem(item));
      console.log("Friend's Posts => ", posts);

      friendPosts.push(...posts);
    }

    // const keys = result.Items?.map((item: any) => ({
    //   PK: `USER#${item.following}`,
    //   SK: `POST#${item.following}`,
    // }));

    // const batchGetParams: any = {
    //   RequestItems: {},
    // };
    // batchGetParams["RequestItems"][process.env.TABLE_NAME!] = {
    //   Keys: keys,
    //   KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
    //   ExpressionAttributeNames: {
    //     "#PK": "PK",
    //     "#SK": "SK",
    //   },
    //   ExpressionAttributeValues: {

    //   }
    // };

    // const friendPosts = await dynamodb.batchGet(batchGetParams).promise();

    console.log("Friends Posts => ", friendPosts);

    return friendPosts;
  } catch (error) {
    console.log("Error => ", error);
    const err: any = error;
    console.log("Error From Fetching Posts => ", err);

    let errorMessage = "Could not fetch Posts";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "Posts Condition checking error";
    }

    throw new Error(errorMessage);
  }
};

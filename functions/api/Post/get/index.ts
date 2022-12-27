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
      ":SK": `POST`,
    },
  };
  try {
    const result = await dynamodb.query(params).promise();
    console.log("Posts => ", result.Items);

    const posts = result.Items?.map((item: any) => Post.fromItem(item));
    console.log("Posts After => ", posts);

    return posts;
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

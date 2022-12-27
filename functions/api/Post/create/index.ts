import AWS = require("aws-sdk");
import { CreatePostInput } from "../../../../types/graphql";
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { Post as PostType } from "../../../entities/Post";
const _Post = require("/opt/Post");
const Post = _Post.Post as typeof PostType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: CreatePostInput;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const postParams: any = {
    username: event.arguments.input.username,
    email: event.arguments.input.email,
    text: event.arguments.input.text,
    timeStamp: Date.now(),
    media: event.arguments.input.media,
  };

  const post = new Post(postParams);

  const params = {
    Item: post.toItem(),
    TableName: process.env.TABLE_NAME!,
    ConditionExpression:
      "attribute_not_exists(PK) and attribute_not_exists(SK)",
  };
  try {
    await dynamodb.put(params).promise();
    return postParams;
  } catch (error) {
    const err: any = error;
    console.log("Error From Adding Post => ", err);

    let errorMessage = "Could not add Post";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "Same Post cannot be posted twice.";
    }

    throw new Error(errorMessage);
  }
};

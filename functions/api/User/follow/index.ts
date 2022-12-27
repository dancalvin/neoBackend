import AWS = require("aws-sdk");
import { FollowUserInput } from "../../../../types/graphql";
import { Friend as FriendType } from "../../../entities/Friend";
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _Friend = require("/opt/Friend");
const Friend = _Friend.Friend as typeof FriendType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: FollowUserInput;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const followParams: any = {
    username: event.arguments.input.username,
    following: event.arguments.input.following,
    timeStamp: Date.now(),
  };

  const friend = new Friend(followParams);

  const params = {
    Item: friend.toItem(),
    TableName: process.env.TABLE_NAME!,
    ConditionExpression:
      "attribute_not_exists(PK) and attribute_not_exists(SK)",
  };
  try {
    await dynamodb.put(params).promise();
    return followParams;
  } catch (error) {
    const err: any = error;
    console.log("Error From Following Friend => ", err);

    let errorMessage = "Could not add Friend";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "Already Followed";
    }

    throw new Error(errorMessage);
  }
};

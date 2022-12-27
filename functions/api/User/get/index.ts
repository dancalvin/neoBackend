import AWS = require("aws-sdk");
import { String } from "aws-sdk/clients/appstream";
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { User as UserType } from "../../../entities/User";
const _User = require("/opt/User");
const User = _User.User as typeof UserType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    username: String;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  console.log(event);
  const username = event.arguments.username;

  const params = {
    TableName: process.env.TABLE_NAME!,
    Key: {
      PK: `USER#${username}`,
      SK: `METADATA#${username}`,
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

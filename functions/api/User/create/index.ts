import AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { User as UserType } from "../../../entities/User";
const _User = require("/opt/User");
const User = _User.User as typeof UserType;

exports.handler = async (event: any) => {
  console.log("Event => ", event);

  const user = new User({
    username: event.userName,
    fullName: event.request.userAttributes.name || "Shariq",
    email: event.request.userAttributes.email,
    birthDate: event.request.userAttributes.birthdate || "1999-01-01",
    age: event.request.userAttributes.age || 22,
    bio: event.request.userAttributes.bio || "",
    address: event.request.userAttributes.address || "",
    profilePicture: event.request.userAttributes.profilePicture || "",
  });
  console.log("User => ", user);

  const userParams = {
    Item: user.toItem(),
    TableName: process.env.TABLE_NAME!,
    ConditionExpression: "attribute_not_exists(PK)",
  };
  try {
    await dynamodb.put(userParams).promise();
    return event;
  } catch (error) {
    const err: any = error;
    console.log("Error From Creating User => ", err);

    let errorMessage = "Could not create User";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "User with this email ID has already registered.";
    }

    throw new Error(errorMessage);
  }
};

import AWS = require("aws-sdk");
import { SendMessageInput } from "../../../../types/graphql";
import { Message as MessageType } from "../../../entities/Message";
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _Message = require("/opt/Message");
const Message = _Message.Message as typeof MessageType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: SendMessageInput;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const sendMessageParams: any = {
    sender: event.arguments.input.sender,
    reciever: event.arguments.input.reciever,
    text: event.arguments.input.text,
    timeStamp: Date.now(),
  };

  const message = new Message(sendMessageParams);

  const params = {
    Item: message.toItem(),
    TableName: process.env.TABLE_NAME!,
    ConditionExpression:
      "attribute_not_exists(PK) and attribute_not_exists(SK)",
  };

  try {
    await dynamodb.put(params).promise();
    return sendMessageParams;
  } catch (error) {
    const err: any = error;
    console.log("Error From Sending Message => ", err);

    let errorMessage = "Could not send Message";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "Same message already sent";
    }

    throw new Error(errorMessage);
  }
};

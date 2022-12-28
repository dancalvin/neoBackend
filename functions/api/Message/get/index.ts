import AWS = require("aws-sdk");
import { GetRecentMessagesInput } from "../../../../types/graphql";
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
import { Message as MessageType } from "../../../entities/Message";
const _Message = require("/opt/Message");
const Message = _Message.Message as typeof MessageType;

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: GetRecentMessagesInput;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const params_sender = {
    TableName: process.env.TABLE_NAME!,
    ScanIndexForward: false,
    KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK",
    },
    ExpressionAttributeValues: {
      ":PK": `USER#${event.arguments.input.username}`,
      ":SK": `MESSAGE#${event.arguments.input.reciever}`,
    },
    Limit: 15,
  };

  const params_reciever = {
    TableName: process.env.TABLE_NAME!,
    ScanIndexForward: false,
    KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK",
    },
    ExpressionAttributeValues: {
      ":PK": `USER#${event.arguments.input.reciever}`,
      ":SK": `MESSAGE#${event.arguments.input.username}`,
    },
    Limit: 15,
  };

  try {
    const resultSender = await dynamodb.query(params_sender).promise();
    console.log("Messages from Sender => ", resultSender.Items);

    const resultReciever = await dynamodb.query(params_reciever).promise();
    console.log("Messages from Reciever => ", resultReciever.Items);

    const messagesSender = resultSender.Items?.map((item: any) =>
      Message.fromItem(item)
    );
    const messagesReciever = resultReciever.Items?.map((item: any) =>
      Message.fromItem(item)
    );

    const messages = messagesSender!.concat(messagesReciever!).sort((a, b) => {
      return b.timeStamp - a.timeStamp;
    });

    return messages;
  } catch (error) {
    console.log("Error => ", error);
    const err: any = error;
    console.log("Error From Fetching Messages => ", err);

    let errorMessage = "Could not fetch Messages";

    if (err.code === "ConditionalCheckFailedException") {
      errorMessage = "Messages Condition checking error";
    }

    throw new Error(errorMessage);
  }
};

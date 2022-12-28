type MessageProp = {
  sender: string;
  reciever: string;
  text: string;
  timeStamp: number;
};

export class Message {
  sender: string;
  reciever: string;
  text: string;
  timeStamp: number;

  constructor(message: MessageProp) {
    this.sender = message.sender;
    this.reciever = message.reciever;
    this.text = message.text;
    this.timeStamp = message.timeStamp;
  }

  static key(sender: string, reciever: string, timeStamp: number) {
    return {
      SK: `MESSAGE#${reciever}#${timeStamp}`,
      PK: `USER#${sender}`,
    };
  }

  toItem() {
    return {
      ...Message.key(this.sender, this.reciever, this.timeStamp),
      Type: "Message",
      Sender: this.sender,
      Reciever: this.reciever,
      Text: this.text,
      TimeStamp: this.timeStamp,
    };
  }

  static fromItem(attributes: any) {
    const message = new Message({
      sender: attributes.Sender,
      reciever: attributes.Reciever,
      text: attributes.Text,
      timeStamp: attributes.TimeStamp,
    });

    return {
      sender: message.sender,
      reciever: message.reciever,
      text: message.text,
      timeStamp: message.timeStamp,
    };
  }
}

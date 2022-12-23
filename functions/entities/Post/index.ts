type PostProp = {
  username: string;
  email: string;
  text: string;
  timeStamp: string;
  media?: string[];
};

export class Post {
  username: string;
  email: string;
  text: string;
  media: string[];
  timeStamp: string;

  constructor(post: PostProp) {
    this.username = post.username;
    this.email = post.email;
    this.text = post.text;
    this.media = post.media || [];
    this.timeStamp = post.timeStamp;
  }

  static key(email: string, timeStamp: string) {
    return {
      SK: `POST#${email}#${timeStamp}`,
      PK: `USER#${email}`,
    };
  }

  toItem() {
    return {
      ...Post.key(this.email, this.timeStamp),
      Type: "Post",
      UserName: this.username,
      Email: this.email,
      Text: this.text,
      Media: this.media,
      TimeStamp: this.timeStamp,
    };
  }

  static fromItem(attributes: PostProp) {
    return new Post({
      username: attributes.username,
      email: attributes.email,
      text: attributes.text,
      media: attributes.media,
      timeStamp: attributes.timeStamp,
    });
  }
}

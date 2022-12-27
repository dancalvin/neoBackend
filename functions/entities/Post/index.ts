type PostProp = {
  username: string;
  email: string;
  text: string;
  timeStamp: number;
  media?: string[];
};

export class Post {
  username: string;
  email: string;
  text: string;
  media: string[];
  timeStamp: number;

  constructor(post: PostProp) {
    this.username = post.username;
    this.email = post.email;
    this.text = post.text;
    this.media = post.media || [];
    this.timeStamp = post.timeStamp;
  }

  static key(username: string, timeStamp: number) {
    return {
      SK: `POST#${username}#${timeStamp}`,
      PK: `USER#${username}`,
    };
  }

  toItem() {
    return {
      ...Post.key(this.username, this.timeStamp),
      Type: "Post",
      UserName: this.username,
      Email: this.email,
      Text: this.text,
      Media: this.media,
      TimeStamp: this.timeStamp,
    };
  }

  static fromItem(attributes: any) {
    const post = new Post({
      username: attributes.UserName,
      email: attributes.Email,
      text: attributes.Text,
      media: attributes.Media,
      timeStamp: attributes.TimeStamp,
    });

    return {
      username: post.username,
      email: post.email,
      text: post.text,
      media: post.media,
      timeStamp: post.timeStamp,
    };
  }
}

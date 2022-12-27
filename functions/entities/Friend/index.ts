type FriendProp = {
  username: string; // The username of the user who is following
  following: string; // The username of the user who is being followed
  timeStamp: number;
};

export class Friend {
  username: string;
  following: string;
  timeStamp: number;

  constructor(friend: FriendProp) {
    this.username = friend.username;
    this.following = friend.following;
    this.timeStamp = friend.timeStamp;
  }

  static key(username: string, following: string) {
    return {
      SK: `FRIEND#${following}`,
      PK: `USER#${username}`,
    };
  }

  toItem() {
    return {
      ...Friend.key(this.username, this.following),
      Type: "Friend",
      UserName: this.username,
      Following: this.following,
      TimeStamp: this.timeStamp,
    };
  }

  static fromItem(attributes: any) {
    const post = new Friend({
      username: attributes.UserName,
      following: attributes.Following,
      timeStamp: attributes.TimeStamp,
    });

    return {
      username: post.username,
      following: post.following,
      timeStamp: post.timeStamp,
    };
  }
}

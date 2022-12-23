type UserProp = {
  username: string;
  email: string;
  birthDate: string;
  age: number;
  fullName: string;
  address?: string | "";
  profilePicture?: string | "";
  bio?: string | "";
};

export class User {
  username: string;
  email: string;
  bio: string;
  birthDate: string;
  age: number;
  fullName: string;
  address: string;
  profilePicture: string;
  numOfFollowers: number;

  constructor(user: UserProp) {
    this.username = user.username;
    this.email = user.email;
    this.bio = user.bio || "";
    this.birthDate = user.birthDate;
    this.age = user.age;
    this.fullName = user.fullName;
    this.address = user.address || "";
    this.profilePicture = user.profilePicture || "";
    this.numOfFollowers = 0;
  }

  static key(email: string) {
    return {
      SK: `METADATA#${email}`,
      PK: `USER#${email}`,
    };
  }

  toItem() {
    return {
      ...User.key(this.email),
      Type: "User",
      UserName: this.username,
      Email: this.email,
      Bio: this.bio,
      BirthDate: this.birthDate,
      Age: this.age,
      FullName: this.fullName,
      Address: this.address,
      ProfilePicture: this.profilePicture,
      NumOfFollowers: this.numOfFollowers,
    };
  }

  static fromItem = (attributes: UserProp) => {
    return new User({
      username: attributes.username,
      email: attributes.email,
      bio: attributes.bio,
      birthDate: attributes.birthDate,
      age: attributes.age,
      fullName: attributes.fullName,
      address: attributes.address,
      profilePicture: attributes.profilePicture,
    });
  };
}

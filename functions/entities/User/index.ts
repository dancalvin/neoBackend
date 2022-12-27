// integrate phone number capability

type UserProp = {
  username: string;
  email: string;
  birthDate: string;
  age: number;
  fullName: string;
  address?: string | "";
  profilePicture?: string | "";
  bio?: string | "";
  numOfFollowers?: number;
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
    this.numOfFollowers = user.numOfFollowers || 0;
  }

  static key(username: string) {
    return {
      SK: `METADATA#${username}`,
      PK: `USER#${username}`,
    };
  }

  toItem() {
    return {
      ...User.key(this.username),
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

  static fromItem = (attributes: any) => {
    const user = new User({
      username: attributes.UserName,
      email: attributes.Email,
      bio: attributes.Bio,
      birthDate: attributes.BirthDate,
      age: attributes.Age,
      fullName: attributes.FullName,
      address: attributes.Address,
      profilePicture: attributes.ProfilePicture,
      numOfFollowers: attributes.NumOfFollowers,
    });

    return {
      username: user.username,
      email: user.email,
      bio: user.bio,
      birthDate: user.birthDate,
      age: user.age,
      fullName: user.fullName,
      address: user.address,
      profilePicture: user.profilePicture,
      numOfFollowers: user.numOfFollowers,
    };
  };
}

class UserModel {
  constructor(idUser, email, name, createdAt = new Date()) {
    this.idUser = idUser;
    this.email = this.email;
    this.name = name;
    this.createdAt = createdAt;
  }
}

export default UserModel;

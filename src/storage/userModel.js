class UserModel {
  constructor(idUser, phone, name, createdAt = new Date()) {
    this.idUser = idUser;
    this.phone = phone;
    this.name = name;
    this.createdAt = createdAt;
  }
}

export default UserModel;

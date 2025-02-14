class MessageModel {
  constructor(idMessage, text, idUser, idGroup, createdAt = new Date()) {
    this.idMessage = idMessage;
    this.text = text;
    this.idUser = idUser;
    this.idGroup = idGroup;
    this.createdAt = createdAt;
  }
}

export default MessageModel;

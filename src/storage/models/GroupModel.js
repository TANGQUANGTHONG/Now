class GroupModel {
  constructor(idGroup, groupName, idUser, createdAt = new Date()) {
    this.idGroup = idGroup;
    this.groupName = groupName;
    this.idUser = idUser;
    this.createdAt = createdAt;
  }
}

export default GroupModel;

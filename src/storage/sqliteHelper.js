import SQLite from 'react-native-sqlite-storage';
import GroupModel from './models/groupModel';
import UserModel from './models/userModel';
import MessageModel from './models/messageModel';

class SQLiteDatabase {
  constructor() {
    this.db = SQLite.openDatabase(
      {name: 'chat.db', location: 'default'},
      () => console.log('Database connected'),
      error => console.error('Database error:', error),
    );
    this.createTables();
  }

  // Khởi tạo các bảng trong DB
  createTables() {
    this.db.transaction(tx => {
      // Bảng người dùng
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => console.log('Table users created'),
        error => console.error('Error creating users table:', error),
      );

      // Bảng nhóm chat
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          groupName TEXT NOT NULL,
          idUser INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (idUser) REFERENCES users(id)
        );`,
        [],
        () => console.log('Table groups created'),
        error => console.error('Error creating groups table:', error),
      );

      // Bảng tin nhắn
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          idUser INTEGER NOT NULL,
          idGroup INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (idUser) REFERENCES users(id),
          FOREIGN KEY (idGroup) REFERENCES groups(id)
        );`,
        [],
        () => console.log('Table messages created'),
        error => console.error('Error creating messages table:', error),
      );
    });
  }

  // Hàm insert User
  insertUser(userModel) {
    if (!(userModel instanceof UserModel)) {
      console.error('Expected an instance of UserModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO users (email, name) VALUES (?, ?);`,
        [userModel.email, userModel.name],
        (_, result) => console.log('User added:', result.insertId),
        error => console.error('Error adding user:', error),
      );
    });
  }

  // Hàm insert Group
  insertGroup(groupModel) {
    if (!(groupModel instanceof GroupModel)) {
      console.error('Expected an instance of GroupModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO groups (groupName, idUser) VALUES (?, ?);`,
        [groupModel.groupName, groupModel.idUser],
        (_, result) => console.log('Group added:', result.insertId),
        error => console.error('Error adding group:', error),
      );
    });
  }

  // Hàm insert Message
  insertMessage(messageModel) {
    if (!(messageModel instanceof MessageModel)) {
      console.error('Expected an instance of MessageModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO messages (text, idUser, idGroup) VALUES (?, ?, ?);`,
        [messageModel.text, messageModel.idUser, messageModel.idGroup],
        (_, result) => console.log('Message added:', result.insertId),
        error => console.error('Error adding message:', error),
      );
    });
  }

  // Hàm xóa User theo ID
  deleteUser(userId) {
    this.db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM users WHERE id = ?;`,
        [userId],
        (_, result) => console.log('User deleted:', result.rowsAffected),
        error => console.error('Error deleting user:', error),
      );
    });
  }

  // Hàm xóa Group theo ID
  deleteGroup(groupId) {
    this.db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM groups WHERE id = ?;`,
        [groupId],
        (_, result) => console.log('Group deleted:', result.rowsAffected),
        error => console.error('Error deleting group:', error),
      );
    });
  }

  // Hàm xóa Message theo ID
  deleteMessage(messageId) {
    this.db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM messages WHERE id = ?;`,
        [messageId],
        (_, result) => console.log('Message deleted:', result.rowsAffected),
        error => console.error('Error deleting message:', error),
      );
    });
  }

  // Hàm sửa User (cập nhật thông tin người dùng)
  updateUser(userModel) {
    if (!(userModel instanceof UserModel)) {
      console.error('Expected an instance of UserModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `UPDATE users SET email = ?, name = ? WHERE id = ?;`,
        [userModel.email, userModel.name, userModel.id],
        (_, result) => console.log('User updated:', result.rowsAffected),
        error => console.error('Error updating user:', error),
      );
    });
  }

  // Hàm sửa Group (cập nhật thông tin nhóm)
  updateGroup(groupModel) {
    if (!(groupModel instanceof GroupModel)) {
      console.error('Expected an instance of GroupModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `UPDATE groups SET groupName = ?, idUser = ? WHERE id = ?;`,
        [groupModel.groupName, groupModel.idUser, groupModel.id],
        (_, result) => console.log('Group updated:', result.rowsAffected),
        error => console.error('Error updating group:', error),
      );
    });
  }

  // Hàm sửa Message (cập nhật tin nhắn)
  updateMessage(messageModel) {
    if (!(messageModel instanceof MessageModel)) {
      console.error('Expected an instance of MessageModel');
      return;
    }
    this.db.transaction(tx => {
      tx.executeSql(
        `UPDATE messages SET text = ?, idUser = ?, idGroup = ? WHERE id = ?;`,
        [
          messageModel.text,
          messageModel.idUser,
          messageModel.idGroup,
          messageModel.id,
        ],
        (_, result) => console.log('Message updated:', result.rowsAffected),
        error => console.error('Error updating message:', error),
      );
    });
  }

  // Hàm lấy tất cả Users
  getAllUsers(callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users;`,
        [],
        (_, result) => {
          const users = [];
          for (let i = 0; i < result.rows.length; i++) {
            users.push(result.rows.item(i));
          }
          callback(users); // Trả về danh sách người dùng
        },
        error => console.error('Error fetching users:', error),
      );
    });
  }

  // Hàm lấy User theo ID
  getUserById(userId, callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users WHERE id = ?;`,
        [userId],
        (_, result) => {
          if (result.rows.length > 0) {
            callback(result.rows.item(0)); // Trả về người dùng theo ID
          } else {
            callback(null); // Không tìm thấy người dùng
          }
        },
        error => console.error('Error fetching user:', error),
      );
    });
  }

  // Hàm lấy tất cả Groups
  getAllGroups(callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM groups;`,
        [],
        (_, result) => {
          const groups = [];
          for (let i = 0; i < result.rows.length; i++) {
            groups.push(result.rows.item(i));
          }
          callback(groups); // Trả về danh sách nhóm
        },
        error => console.error('Error fetching groups:', error),
      );
    });
  }

  // Hàm lấy Group theo ID
  getGroupById(groupId, callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM groups WHERE id = ?;`,
        [groupId],
        (_, result) => {
          if (result.rows.length > 0) {
            callback(result.rows.item(0)); // Trả về nhóm theo ID
          } else {
            callback(null); // Không tìm thấy nhóm
          }
        },
        error => console.error('Error fetching group:', error),
      );
    });
  }

  // Hàm lấy tất cả Messages
  getAllMessages(callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM messages;`,
        [],
        (_, result) => {
          const messages = [];
          for (let i = 0; i < result.rows.length; i++) {
            messages.push(result.rows.item(i));
          }
          callback(messages); // Trả về danh sách tin nhắn
        },
        error => console.error('Error fetching messages:', error),
      );
    });
  }

  // Hàm lấy Message theo ID
  getMessageById(messageId, callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM messages WHERE id = ?;`,
        [messageId],
        (_, result) => {
          if (result.rows.length > 0) {
            callback(result.rows.item(0)); // Trả về tin nhắn theo ID
          } else {
            callback(null); // Không tìm thấy tin nhắn
          }
        },
        error => console.error('Error fetching message:', error),
      );
    });
  }

  // Hàm lấy tất cả Messages từ idGroup
  getListMessageByGroupId(idGroup, callback) {
    this.db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM messages WHERE idGroup = ?;`,
        [idGroup],
        (_, result) => {
          const messages = [];
          for (let i = 0; i < result.rows.length; i++) {
            messages.push(result.rows.item(i));
          }
          callback(messages); // Trả về danh sách tin nhắn của nhóm
        },
        error => console.error('Error fetching messages by groupId:', error),
      );
    });
  }
}
export default SQLiteDatabase;

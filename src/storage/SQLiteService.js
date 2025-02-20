import SQLite from 'react-native-sqlite-storage';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

// Mở hoặc tạo database SQLite
const db = SQLite.openDatabase(
  {name: 'FirebaseData.db', location: 'default'},
  () => console.log('SQLite Database Opened'),
  error => console.log('SQLite Error:', error),
);

// Tạo bảng nếu chưa có
const createTables = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS chats (
        chatId TEXT PRIMARY KEY, 
        users TEXT
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS messages (
        messageId TEXT PRIMARY KEY, 
        chatId TEXT,
        senderId TEXT,
        text TEXT,
        timestamp INTEGER,
        selfDestruct INTEGER,
        FOREIGN KEY(chatId) REFERENCES chats(chatId)
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        image TEXT,
        createdAt INTEGER,
        email TEXT,
        name TEXT,
        nickname TEXT
      );`,
    );
  });
};

// Hàm lưu tin nhắn vào SQLite
const saveMessageToSQLite = (
  messageId,
  chatId,
  senderId,
  text,
  timestamp,
  selfDestruct,
) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO messages (messageId, chatId, senderId, text, timestamp, selfDestruct) 
       VALUES (?, ?, ?, ?, ?, ?);`,
      [messageId, chatId, senderId, text, timestamp, selfDestruct ? 1 : 0],
    );
  });
};

// Hàm lưu thông tin chat vào SQLite
const saveChatToSQLite = (chatId, users) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO chats (chatId, users) VALUES (?, ?);`,
      [chatId, JSON.stringify(users)],
    );
  });
};

// Hàm lưu thông tin user vào SQLite
const saveUserToSQLite = (userId, image, createdAt, email, name, nickname) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO users (userId, image, createdAt, email, name, nickname) VALUES (?, ?, ?, ?, ?, ?);`,
      [userId, image, createdAt, email, name, nickname],
    );
  });
};

// Lắng nghe tin nhắn mới
export const listenForNewMessages = () => {
  const currentUser = auth().currentUser;

  if (!currentUser) return;

  const currentUserId = currentUser.uid;
  database()
    .ref('/chats')
    .on('child_changed', snapshot => {
      const chatData = snapshot.val();
      const chatId = snapshot.key;

      if (!chatData || !chatData.messages || !chatData.users) return;
      if (!chatData.users[currentUserId]) return;

      const messagesArray = Object.entries(chatData.messages);
      const lastMessageEntry = messagesArray.reduce((latest, current) =>
        latest[1].timestamp > current[1].timestamp ? latest : current,
      );

      if (!lastMessageEntry) return;

      const [lastMessageKey, lastMessage] = lastMessageEntry;

      if (lastMessage.senderId !== currentUserId) {
        saveMessageToSQLite(
          lastMessageKey,
          chatId,
          lastMessage.senderId,
          lastMessage.text,
          lastMessage.timestamp,
          lastMessage.selfDestruct,
        );
      }
    });
};

// Lắng nghe cuộc trò chuyện mới
export const listenForNewChats = () => {
  const currentUser = auth().currentUser;

  if (!currentUser) return;

  const currentUserId = currentUser.uid;
  database()
    .ref('/chats')
    .on('child_added', snapshot => {
      const chatData = snapshot.val();
      const chatId = snapshot.key;

      if (!chatData || !chatData.users) return;

      if (chatData.users[currentUserId]) {
        saveChatToSQLite(chatId, chatData.users);
      }
    });
};

// Đồng bộ dữ liệu từ Firebase về SQLite
export const syncDataFromFirebase = async () => {
  createTables();

  const currentUser = auth().currentUser;
  if (!currentUser) return;

  const currentUserId = currentUser.uid;

  const userRef = database().ref(`/users/${currentUserId}`);
  const userSnapshot = await userRef.once('value');

  if (userSnapshot.exists()) {
    const userData = userSnapshot.val();
    saveUserToSQLite(
      currentUserId,
      userData.image,
      userData.createdAt,
      userData.email,
      userData.name,
      userData.nickname,
    );
  }

  listenForNewMessages();
  listenForNewChats();
};

// Lấy toàn bộ tin nhắn từ SQLite
export const getAllMessagesAsJson = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM messages ORDER BY timestamp ASC;`,
        [],
        (_, results) => {
          let messagesArray = [];
          for (let i = 0; i < results.rows.length; i++) {
            let row = results.rows.item(i);
            messagesArray.push(row);
          }
          resolve(messagesArray);
        },
        error => reject(error),
      );
    });
  });
};

// Lấy toàn bộ users từ SQLite
export const getAllUsersAsJson = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users;`,
        [],
        (_, results) => {
          let usersArray = [];
          for (let i = 0; i < results.rows.length; i++) {
            let row = results.rows.item(i);
            usersArray.push(row);
          }
          resolve(usersArray);
        },
        error => reject(error),
      );
    });
  });
};

// Lấy toàn bộ cuộc trò chuyện từ SQLite
export const getAllChatsAsJson = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM chats;`,
        [],
        (_, results) => {
          let chatsArray = [];
          for (let i = 0; i < results.rows.length; i++) {
            let row = results.rows.item(i);
            chatsArray.push({
              chatId: row.chatId,
              users: JSON.parse(row.users),
            });
          }
          resolve(chatsArray);
        },
        error => reject(error),
      );
    });
  });
};

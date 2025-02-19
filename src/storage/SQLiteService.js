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
const createChatsTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY, 
        users TEXT, 
        messages TEXT
      );`,
      [],
      () => console.log('Table `chats` created'),
      error => console.log('Table creation error:', error),
    );
  });
};

// Lưu dữ liệu vào SQLite
const saveChatToSQLite = (chatId, users, messages) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO chats (id, users, messages) VALUES (?, ?, ?);`,
      [chatId, JSON.stringify(users), JSON.stringify(messages)],
      () => console.log(`Chat ${chatId} saved to SQLite`),
      error => console.log('Insert Error:', error),
    );
  });
};

// Lấy dữ liệu từ SQLite
export const getChatsFromSQLite = callback => {
  if (!db) {
    console.log('Database chưa được mở!');
    callback([]); // Đảm bảo callback luôn có giá trị
    return;
  }

  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM chats;`,
      [],
      (_, results) => {
        let rows = results.rows.raw();

        if (!rows || rows.length === 0) {
          console.log(' Không có dữ liệu trong SQLite');
        }

        const formattedRows = rows.map(chat => ({
          chatId: chat.id,
          users: chat.users ? JSON.parse(chat.users) : {},
          messages: chat.messages ? JSON.parse(chat.messages) : {},
        }));

        callback(formattedRows);
      },
      error => {
        console.log(' Fetch Error:', error);
        callback([]); // Đảm bảo không trả về undefined
      },
    );
  });
};

// Xóa toàn bộ dữ liệu trong bảng chats
export const clearChatsTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM chats;`,
      [],
      () => console.log('Table `chats` cleared'),
      error => console.log('Delete Error:', error),
    );
  });
};

// Lấy userId từ Firebase Authentication
export const getCurrentUserId = () => {
  return new Promise(resolve => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        console.log('User ID:', user.uid);
        resolve(user.uid);
      } else {
        console.log('User not logged in');
        resolve(null);
      }
      unsubscribe();
    });
  });
};

// Lấy tất cả chats mà user tham gia
export const getUserChats = async userId => {
  if (!userId) return [];

  console.log(`Fetching chats for user: ${userId}`);
  const userChats = [];

  try {
    const chatsSnapshot = await database().ref('/chats').once('value');

    if (chatsSnapshot.exists()) {
      const chats = chatsSnapshot.val();

      for (const chatId in chats) {
        if (chats[chatId].users && chats[chatId].users[userId]) {
          userChats.push({
            chatId,
            users: chats[chatId].users,
            messages: chats[chatId].messages || {},
          });
        }
      }
    }

    console.log('User chats fetched:', userChats);
    return userChats;
  } catch (error) {
    console.log('Error fetching chats:', error);
    return [];
  }
};

// Kết nối database và lưu dữ liệu vào SQLite
export const connectDb = async () => {
  createChatsTable();

  const idUser = await getCurrentUserId();
  if (!idUser) return;

  const userChats = await getUserChats(idUser);

  // Lưu từng cuộc trò chuyện vào SQLite
  userChats.forEach(chat => {
    saveChatToSQLite(chat.chatId, chat.users, chat.messages);
  });
  console.log('All chats saved to SQLite');
};

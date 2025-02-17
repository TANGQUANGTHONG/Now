import SQLite from 'react-native-sqlite-storage';
import {decryptMessage, encryptMessage} from '../chat/maHoa'; // Import hàm mã hóa/giải mã
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Kết nối cơ sở dữ liệu SQLite
const db = SQLite.openDatabase(
  {name: 'appchat.db', location: 'default'},
  () => console.log('Database connected'),
  error => console.log('Database error:', error),
);

// 1. Tạo bảng chats nếu chưa có
export const createChatsTable = () => {
  try {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          users TEXT,
          lastMessage TEXT,
          timestamp INTEGER
        );`,
        [],
        () => console.log('Chats table created successfully'),
        error => console.log('Error creating chats table:', error),
      );
    });
  } catch (err) {
    console.error('SQLite transaction error:', err);
  }
};

// 2. Lưu dữ liệu vào SQLite với kiểm tra dữ liệu đầu vào
export const insertChatToSQLite = async (id, users, lastMessage, timestamp) => {
  try {
    if (!lastMessage || lastMessage.trim() === '') {
      console.warn('Missing lastMessage, using default value');
      lastMessage = encryptMessage('No message');
    }

    const safeUsers = Array.isArray(users)
      ? JSON.stringify(users)
      : JSON.stringify([]);

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO chats (id, users, lastMessage, timestamp) 
            VALUES (?, ?, ?, ?);`,
          [id, safeUsers, lastMessage, timestamp],
          () => {
            console.log('Chat inserted/updated successfully:', id);
            resolve();
          },
          error => {
            console.log('Error inserting/updating chat:', error);
            reject(error);
          },
        );
      });
    });
  } catch (err) {
    console.error('Error in insertChatToSQLite:', err);
  }
};

// 3. Lấy tất cả dữ liệu từ SQLite và giải mã tin nhắn
export const getAllChatsFromSQLite = setChats => {
  try {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM chats ORDER BY timestamp DESC;',
        [],
        (tx, results) => {
          let chats = [];
          for (let i = 0; i < results.rows.length; i++) {
            let item = results.rows.item(i);
            let decryptedLastMessage = '';
            try {
              decryptedLastMessage = decryptMessage(item.lastMessage);
            } catch (err) {
              console.log('Decryption error:', err);
              decryptedLastMessage = 'Error decrypting message';
            }

            chats.push({
              id: item.id,
              users: JSON.parse(item.users),
              lastMessage: decryptedLastMessage,
              timestamp: new Date(item.timestamp),
            });
          }
          setChats(chats);
        },
        error => console.log('Error fetching chats from SQLite:', error),
      );
    });
  } catch (err) {
    console.error('Error in getAllChatsFromSQLite:', err);
  }
};

// 4. Đồng bộ tất cả dữ liệu từ Firestore về SQLite
export const fetchAndStoreAllChats = async () => {
  try {
    const chatsSnapshot = await firestore().collection('chats').get();
    chatsSnapshot.forEach(doc => {
      const data = doc.data();
      const lastMsg = data.lastMessage
        ? encryptMessage(data.lastMessage)
        : encryptMessage('No message');
      insertChatToSQLite(
        doc.id,
        data.users,
        lastMsg,
        data.timestamp ? data.timestamp.toDate().getTime() : Date.now(),
      );
    });
    console.log('All chats fetched and stored in SQLite');
  } catch (error) {
    console.error('Error fetching and storing chats:', error);
  }
};

// 5. Đồng bộ dữ liệu từ Firestore cho người dùng hiện tại
export const fetchAndStoreChatsForCurrentUser = async () => {
  try {
    createChatsTable();
    const currentUserId = auth().currentUser?.uid;
    if (!currentUserId) throw new Error('User not authenticated');

    const chatSnapshot = await firestore()
      .collection('chats')
      .where('users', 'array-contains', currentUserId)
      .get();

    const chats = chatSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        chatId: doc.id,
        users: data.users,
        lastMessage: data.lastMessage || 'No message',
        timestamp: data.timestamp
          ? data.timestamp.toDate().getTime()
          : Date.now(),
      };
    });

    for (const chat of chats) {
      await insertChatToSQLite(
        chat.chatId,
        chat.users,
        encryptMessage(chat.lastMessage),
        chat.timestamp,
      );
    }
    console.log('All chats for current user stored in SQLite', chats);
  } catch (error) {
    console.error('Error fetching and storing chats:', error);
  }
};

export default db;

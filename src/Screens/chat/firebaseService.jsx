import { db } from '../../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';

// Hàm gửi tin nhắn
export const sendMessage = async (chatId, senderId, receiverId, text) => {
  try {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error);
  }
};

// Hàm lắng nghe tin nhắn theo chatId
export const listenForMessages = (chatId, callback) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

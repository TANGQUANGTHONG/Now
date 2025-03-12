import { useEffect } from 'react';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { decryptMessage, generateSecretKey } from '../cryption/Encryption';

const useListenForNewMessages = () => {
  useEffect(() => {
    const myId = auth().currentUser?.uid;
    if (!myId) return;

    const chatsRef = database().ref('/chats');

    const onNewMessage = async snapshot => {
      if (!snapshot.exists()) return;

      try {
        const chatData = snapshot.val();
        const chatEntries = Object.entries(chatData);

        for (const [chatId, chat] of chatEntries) {
          if (!chat.users || !chat.users[myId] || !chat.messages) continue;

          const otherUserId = Object.keys(chat.users).find(uid => uid !== myId);
          if (!otherUserId) continue;

          const secretKey = generateSecretKey(myId, otherUserId);

          // 🔥 Lấy tin nhắn từ Firebase và giải mã
          let newMessages = Object.entries(chat.messages)
            .map(([id, msg]) => ({
              id,
              senderId: msg.senderId,
              text: msg.text ? decryptMessage(msg.text, secretKey) : '📷 Ảnh mới',
              imageUrl: msg.imageUrl || null,
              timestamp: msg.timestamp,
              selfDestruct: msg.selfDestruct || false,
              selfDestructTime: msg.selfDestructTime || null,
              seen: msg.seen || {},
              deleted: msg.deleted || false,
              isLocked: msg.selfDestruct,
            }))
            .filter(msg => !msg.deleted) // ❌ Loại bỏ tin nhắn đã bị xóa
            .sort((a, b) => a.timestamp - b.timestamp);

          // 🔥 Lấy dữ liệu cũ từ AsyncStorage
          const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
          const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

          // 🔥 Chỉ lấy tin nhắn mới hơn dữ liệu cũ
          const latestTimestamp = oldMessages.length > 0 ? oldMessages[oldMessages.length - 1].timestamp : 0;
          newMessages = newMessages.filter(msg => msg.timestamp > latestTimestamp);

          if (newMessages.length > 0) {
            const updatedMessages = [...oldMessages, ...newMessages];

            // 🔥 Lưu dữ liệu mới vào AsyncStorage
            await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
            console.log(`✅ Đã thêm ${newMessages.length} tin nhắn mới cho chat ${chatId}`);

            // 🔥 Xóa tin nhắn khỏi Firebase sau khi lưu
            newMessages.forEach(async msg => {
              await database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
              console.log(`🗑 Đã xóa tin nhắn ${msg.id} khỏi Firebase`);
            });
          }
        }
      } catch (error) {
        console.error('❌ Lỗi khi lưu tin nhắn vào AsyncStorage:', error);
      }
    };

    chatsRef.on('value', onNewMessage);
    return () => chatsRef.off('value', onNewMessage);
  }, []);
};

export default useListenForNewMessages;

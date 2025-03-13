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
            .filter(msg => !msg.deleted) // ❌ Bỏ qua tin nhắn đã xóa
            .sort((a, b) => a.timestamp - b.timestamp);

          // Lấy dữ liệu cũ từ AsyncStorage
          const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
          const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

          // 🔥 Chỉ lấy tin nhắn mới hơn dữ liệu cũ
          const latestTimestamp = oldMessages.length > 0 ? oldMessages[oldMessages.length - 1].timestamp : 0;
          newMessages = newMessages.filter(msg => msg.timestamp > latestTimestamp);

          if (newMessages.length > 0) {
            const updatedMessages = [...oldMessages, ...newMessages];

            // ✅ Lưu tin nhắn vào AsyncStorage trước khi xóa trên Firebase
            await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));

            console.log(`✅ Đã thêm ${newMessages.length} tin nhắn mới vào local cho chat ${chatId}`);

            // 🔥 Xóa tin nhắn khỏi Firebase sau khi lưu xong
            newMessages.forEach(async msg => {
                setTimeout(async () => {
              await database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
            }, 5000)
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

import { useEffect } from 'react';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { decryptMessage } from '../cryption/Encryption';

const useListenForNewMessages = () => {
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const chatsRef = database().ref('/chats');

    const onNewMessage = async snapshot => {
      if (!snapshot.exists()) return;

      try {
        const chatData = snapshot.val();
        const chatEntries = Object.entries(chatData);

        for (const [chatId, chat] of chatEntries) {
          if (!chat.messages) continue;

          const messages = Object.entries(chat.messages).map(([id, msg]) => ({
            id,
            senderId: msg.senderId,
            text: decryptMessage( msg.text )|| '📷 Ảnh mới',
            imageUrl: msg.imageUrl || null,
            timestamp: msg.timestamp,
            selfDestruct: msg.selfDestruct || false,
            selfDestructTime: msg.selfDestructTime || null,
            seen: msg.seen || {},
            deleted: msg.deleted || false,
            isLocked: msg.selfDestruct,
          }));

          const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
          const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

          // 🔥 Gộp tin nhắn mới mà không bị trùng
          const updatedMessages = [...oldMessages, ...messages]
            .filter((msg, index, self) => index === self.findIndex(m => m.id === msg.id))
            .sort((a, b) => a.timestamp - b.timestamp);

          await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
          console.log(`✅ Tin nhắn của ${chatId} đã lưu vào AsyncStorage!`);
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

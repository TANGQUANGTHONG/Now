import {useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';
import PushNotification from 'react-native-push-notification';
import {decryptMessage, generateSecretKey} from '../cryption/Encryption';
import {
  getDatabase,
  ref,
  onValue,
  get,
  orderByChild,
  query,
  limitToLast,
} from '@react-native-firebase/database';

const db = getDatabase();

export const pushNotification = () => {
  useEffect(() => {
    const currentUserId = auth().currentUser?.uid;
    if (!currentUserId) return;

    const chatRef = ref(db, 'chats');

    onValue(chatRef, async snapshot => {
      if (!snapshot.exists()) {
        return;
      }

      const chatsData = snapshot.val();
      const chatEntries = Object.entries(chatsData);

      const chatPromises = chatEntries.map(async ([chatId, chat]) => {
        if (!chat.users || !chat.users[currentUserId]) return null;

        const otherUserId = Object.keys(chat.users).find(
          uid => uid !== currentUserId,
        );
        if (!otherUserId) return null;

        const userRef = ref(db, `users/${otherUserId}`);
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) return null;

        const userInfo = userSnapshot.val();
        const decryptedName = safeDecrypt(userInfo?.name);
        const decryptedImage = safeDecrypt(userInfo?.Image);

        // Lấy tin nhắn mới nhất
        const messagesRef = query(
          ref(db, `chats/${chatId}/messages`),
          orderByChild('timestamp'),
          limitToLast(1),
        );
        const messagesSnapshot = await get(messagesRef);

        let lastMessage = 'Chưa có tin nhắn';
        let lastMessageTime = '';
        let lastMessageTimestamp = 0;
        const secretKey = generateSecretKey(otherUserId, currentUserId);

        if (messagesSnapshot.exists()) {
          const lastMessageData = Object.values(messagesSnapshot.val())[0];
          lastMessage =
            decryptMessage(lastMessageData.text, secretKey) ||
            'Tin nhắn bị mã hóa';
          lastMessageTime = new Date(
            lastMessageData.timestamp,
          ).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          lastMessageTimestamp = lastMessageData.timestamp;
        }

        return {
          chatId,
          id: otherUserId,
          name: decryptedName || 'Người dùng',
          img: decryptedImage || 'https://example.com/default-avatar.png',
          text: lastMessage,
          time: lastMessageTime,
          timestamp: lastMessageTimestamp,
        };
      });

      const resolvedChats = await Promise.all(chatPromises);
      const filteredChats = resolvedChats
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);

      // Sau khi setChatList xong, gửi thông báo
      if (filteredChats.length > 0) {
        const latestChat = filteredChats[0];
        PushNotification.localNotification({
          channelId: 'default-channel',
          title: `Tin nhắn từ ${latestChat.name}`,
          message: latestChat.text,
          playSound: true,
          soundName: 'default',
        });
      }
    });
  }, []);

  return null; // Không cần return UI
};

// Hàm giải mã an toàn
const safeDecrypt = encryptedText => {
  try {
    if (!encryptedText) return 'Nội dung trống';
    const decryptedText = decryptMessage(encryptedText);
    if (!decryptedText || decryptedText === ' Lỗi giải mã') {
      return 'Tin nhắn bị mã hóa';
    }
    return decryptedText;
  } catch (error) {
    console.error('Lỗi giải mã:', error);
    return 'Tin nhắn bị mã hóa';
  }
};

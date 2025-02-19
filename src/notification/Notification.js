import {useEffect, useRef} from 'react';
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
  const lastMessageTimestamp = useRef(0);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(currentUser => {
      if (!currentUser) return;
      const currentUserId = currentUser.uid;

      const chatRef = ref(db, 'chats');

      onValue(chatRef, snapshot => {
        if (!snapshot.exists()) {
          return;
        }

        const chatsData = snapshot.val();
        const chatEntries = Object.entries(chatsData);

        const chatPromises = chatEntries.map(([chatId, chat]) => {
          if (!chat.users || !chat.users[currentUserId]) return null;

          const otherUserId = Object.keys(chat.users).find(
            uid => uid !== currentUserId,
          );
          if (!otherUserId) return null;

          return get(ref(db, `users/${otherUserId}`)).then(userSnapshot => {
            if (!userSnapshot.exists()) return null;

            const userInfo = userSnapshot.val();
            const decryptedName = safeDecrypt(userInfo?.name);
            const decryptedImage = safeDecrypt(userInfo?.Image);

            return get(
              query(
                ref(db, `chats/${chatId}/messages`),
                orderByChild('timestamp'),
                limitToLast(1),
              ),
            ).then(messagesSnapshot => {
              if (!messagesSnapshot.exists()) return null;

              const lastMessageData = Object.values(messagesSnapshot.val())[0];

              if (lastMessageData.senderId === currentUserId) return null;

              const currentTime = Date.now();
              if (
                lastMessageData.timestamp <= lastMessageTimestamp.current ||
                lastMessageData.timestamp < currentTime - 5000
              ) {
                return null;
              }

              const secretKey = generateSecretKey(otherUserId, currentUserId);
              const lastMessage =
                decryptMessage(lastMessageData.text, secretKey) ||
                'Tin nhắn bị mã hóa';
              const lastMessageTime = new Date(
                lastMessageData.timestamp,
              ).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

              return {
                chatId,
                id: otherUserId,
                name: decryptedName || 'Người dùng',
                img: decryptedImage || 'https://example.com/default-avatar.png',
                text: lastMessage,
                time: lastMessageTime,
                timestamp: lastMessageData.timestamp,
              };
            });
          });
        });

        Promise.all(chatPromises).then(resolvedChats => {
          const filteredChats = resolvedChats
            .filter(Boolean)
            .sort((a, b) => b.timestamp - a.timestamp);

          if (filteredChats.length > 0) {
            const latestChat = filteredChats[0];

            PushNotification.localNotification({
              channelId: 'default-channel',
              title: `Tin nhắn từ ${latestChat.name}`,
              message: latestChat.text,
              playSound: true,
              soundName: 'default',
            });

            lastMessageTimestamp.current = latestChat.timestamp;
          }
        });
      });
    });

    return () => unsubscribeAuth();
  }, []);

  return null;
};

// Hàm giải mã an toàn
const safeDecrypt = encryptedText => {
  try {
    if (!encryptedText) return 'Nội dung trống';
    const decryptedText = decryptMessage(encryptedText);
    return decryptedText || 'Tin nhắn bị mã hóa';
  } catch (error) {
    console.error('Lỗi giải mã:', error);
    return 'Tin nhắn bị mã hóa';
  }
};

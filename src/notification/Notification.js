import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import PushNotification from 'react-native-push-notification';
import {
  decryptMessage,
  encryptMessage,
  generateSecretKey,
} from '../cryption/Encryption';

const lastProcessedMessage = {}; // Lưu tin nhắn cuối cùng của mỗi cuộc trò chuyện
let lastNotificationTimestamp = 0; // Tránh spam thông báo liên tục

export const configurePushNotification = () => {
  PushNotification.createChannel(
    {
      channelId: 'default-channel-id',
      channelName: 'Thông báo tin nhắn',
      channelDescription: 'Nhận thông báo khi có tin nhắn mới',
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
    },
    created => console.log(`Kênh thông báo đã tạo: ${created}`),
  );
};

export const sendLocalNotification = (title, message) => {
  const now = Date.now();

  if (now - lastNotificationTimestamp < 3000) {
    console.log('Thông báo bị chặn để tránh spam.');
    return;
  }

  lastNotificationTimestamp = now;
  console.log(`Gửi thông báo: ${title} - ${message}`);

  PushNotification.localNotification({
    channelId: 'default-channel-id',
    title: title || 'Người dùng',
    message: message,
    playSound: true,
    soundName: 'default',
    importance: 4,
    vibrate: true,
  });
};

export const listenForNewMessages = async () => {
  const currentUserId = auth().currentUser?.uid;
  if (!currentUserId) {
    console.log('Không tìm thấy ID user hiện tại.');
    return;
  }

  const chatsRef = database().ref('/chats');

  chatsRef.on('value', snapshot => {
    if (!snapshot.exists()) return;

    const chatsData = snapshot.val();
    Object.keys(chatsData).forEach(async chatId => {
      if (!chatsData[chatId].users || !chatsData[chatId].users[currentUserId])
        return;

      const messagesRef = database().ref(`/chats/${chatId}/messages`);
      messagesRef.off('child_added');

      messagesRef.on('child_added', async messageSnapshot => {
        const messageData = messageSnapshot.val();
        if (
          !messageData ||
          !messageData.senderId ||
          !messageData.text ||
          !messageData.timestamp
        )
          return;
        if (messageData.senderId === currentUserId) return;

        // Chỉ gửi thông báo nếu tin nhắn mới chưa được xử lý
        if (
          !lastProcessedMessage[chatId] ||
          messageData.timestamp > lastProcessedMessage[chatId]
        ) {
          lastProcessedMessage[chatId] = messageData.timestamp; // Cập nhật tin nhắn cuối cùng

          const senderName = await getSenderName(
            messageData.senderId,
            currentUserId,
          );

          const secretKey = generateSecretKey(
            messageData.senderId,
            currentUserId,
          );
          const decryptedText = safeDecrypt(messageData.text, secretKey);

          sendLocalNotification(senderName, decryptedText);
        }
      });
    });
  });
};

const getSenderName = async (senderId, currentUserId) => {
  try {
    const snapshot = await database()
      .ref(`/users/${senderId}/name`)
      .once('value');

    if (!snapshot.exists()) {
    }

    const name = decryptMessage(snapshot.val());
    return name;
  } catch (error) {
    return;
  }
};

// Hàm giải mã tin nhắn an toàn
const safeDecrypt = (encryptedText, secretKey) => {
  try {
    if (!encryptedText) return 'Nội dung trống';

    const decryptedText = decryptMessage(encryptedText, secretKey);
    return decryptedText && decryptedText !== 'Lỗi giải mã'
      ? decryptedText
      : 'Tin nhắn bị mã hóa';
  } catch (error) {
    console.error('Lỗi giải mã:', error);
    return 'Tin nhắn bị mã hóa';
  }
};

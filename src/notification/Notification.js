import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import PushNotification from 'react-native-push-notification';
import {decryptMessage, generateSecretKey} from '../cryption/Encryption';

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
    return; // Chặn spam thông báo trong vòng 3 giây
  }

  lastNotificationTimestamp = now;
  console.log(`🔔 Gửi thông báo: ${title} - ${message}`);

  PushNotification.localNotification({
    channelId: 'default-channel-id',
    title: title,
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

  // Lấy tin nhắn cuối cùng trước khi bắt đầu lắng nghe sự kiện mới
  const snapshot = await chatsRef.once('value');
  if (!snapshot.exists()) return;

  const chatsData = snapshot.val();
  Object.keys(chatsData).forEach(chatId => {
    if (!chatsData[chatId].users || !chatsData[chatId].users[currentUserId])
      return;

    // Lấy tin nhắn mới nhất theo timestamp
    const messages = Object.entries(chatsData[chatId].messages || {})
      .map(([key, value]) => ({id: key, ...value}))
      .sort((a, b) => b.timestamp - a.timestamp);

    lastProcessedMessage[chatId] =
      messages.length > 0 ? messages[0].timestamp : 0;

    const messagesRef = database().ref(`/chats/${chatId}/messages`);

    // Hủy lắng nghe trước khi thêm mới
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

      // Nếu tin nhắn này là của user hiện tại -> Bỏ qua
      if (messageData.senderId === currentUserId) return;

      // Nếu tin nhắn đã từng được xử lý -> Bỏ qua
      if (messageData.timestamp <= lastProcessedMessage[chatId]) {
        return;
      }

      lastProcessedMessage[chatId] = messageData.timestamp; // Cập nhật timestamp tin nhắn cuối cùng

      // Lấy tên người gửi
      const senderName = await getSenderName(messageData.senderId);

      // Giải mã tin nhắn
      const secretKey = generateSecretKey(messageData.senderId, currentUserId);
      const decryptedText = safeDecrypt(messageData.text, secretKey);

      console.log(`📩 Tin nhắn mới từ ${senderName}: ${decryptedText}`);

      // Gửi thông báo
      sendLocalNotification(`New message `, `${decryptedText}`);
    });
  });
};

// Lấy tên người gửi từ Firebase
const getSenderName = async senderId => {
  try {
    const snapshot = await database()
      .ref(`/users/${senderId}/name`)
      .once('value');
    return snapshot.exists() ? snapshot.val() : 'Người dùng';
  } catch (error) {
    console.error('Lỗi khi lấy tên người gửi:', error);
    return 'Người dùng';
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

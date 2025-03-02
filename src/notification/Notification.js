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
  console.log(`Gửi thông báo: ${title} - ${message}`);

  PushNotification.localNotification({
    channelId: 'default-channel-id',
    title: "Người dùng",
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
    console.log("Không tìm thấy ID user hiện tại.");
    return;
  }

  const chatsRef = database().ref('/chats');

  chatsRef.on("value", (snapshot) => {
    if (!snapshot.exists()) return;

    const chatsData = snapshot.val();
    Object.keys(chatsData).forEach(async (chatId) => {  
      if (!chatsData[chatId].users || !chatsData[chatId].users[currentUserId]) return;

      const messagesRef = database().ref(`/chats/${chatId}/messages`);
      messagesRef.off("child_added"); // 🔥 Hủy lắng nghe cũ trước khi đăng ký mới

      messagesRef.on("child_added", async (messageSnapshot) => {
        const messageData = messageSnapshot.val();
        if (!messageData || !messageData.senderId || !messageData.text || !messageData.timestamp) return;
        if (messageData.senderId === currentUserId) return; // Bỏ qua tin nhắn của chính mình

        // Chỉ gửi thông báo nếu tin nhắn mới chưa được xử lý
        if (!lastProcessedMessage[chatId] || messageData.timestamp > lastProcessedMessage[chatId]) {
          lastProcessedMessage[chatId] = messageData.timestamp; // Cập nhật tin nhắn cuối cùng

          // 🔥 Lấy và giải mã tên người gửi
          const senderName = await getSenderName(messageData.senderId, currentUserId); // ❌ Không cần giải mã lại

          // 🔐 Giải mã tin nhắn
          const secretKey = generateSecretKey(messageData.senderId, currentUserId);
          const decryptedText = safeDecrypt(messageData.text, secretKey);

          console.log(`📩 Tin nhắn mới từ ${senderName}: ${decryptedText}`);

          // 🔔 Gửi thông báo với tên người gửi
          sendLocalNotification(senderName, decryptedText);
        }
      });
    });
  });
};

const getSenderName = async (senderId, currentUserId) => {
  try {
    const snapshot = await database().ref(`/users/${senderId}/name`).once('value');

    if (!snapshot.exists()) {
      console.log(`❌ Không tìm thấy tên của ${senderId} trong Firebase.`);
      return 'Người dùng';
    }

    const encryptedName = snapshot.val(); // 🔥 Lấy tên đã mã hóa từ Firebase

    // 🔐 Tạo secret key
    const secretKey = generateSecretKey(senderId, currentUserId);

    // 🔓 Giải mã tên người gửi
    const decryptedName = decryptMessage(encryptedName, senderId, currentUserId);

    console.log(`🔍 Dữ liệu từ Firebase: ${encryptedName}`);
    console.log(`🔑 Secret Key: ${secretKey}`);
    console.log(`✅ Tên đã giải mã: ${decryptedName}`);

    return decryptedName !== '' ? decryptedName : 'Người dùng';
  } catch (error) {
    console.error('❌ Lỗi khi lấy tên người gửi:', error);
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

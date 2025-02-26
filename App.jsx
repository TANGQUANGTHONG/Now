import React, { useEffect } from 'react';
import { saveCurrentUserAsyncStorage, saveChatsAsyncStorage, getChatsByUserId, saveUserUidToAsyncStorage } from './src/storage/Storage';
import AppNavigation from './src/navigations/AppNavigation';
import { configurePushNotification, listenForNewMessages } from './src/notification/Notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
const App = () => {
  const user = auth().currentUser;

  // Bật thông báo khi app khởi động
  useEffect(() => {
    configurePushNotification();
    saveUserUidToAsyncStorage(user.uid)
  }, []);

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    listenForNewMessages();
  }, []);

  // Lưu thông tin user, chat vào AsyncStorage
  useEffect(() => {
    saveCurrentUserAsyncStorage();
    saveChatsAsyncStorage();
  }, []);

  // Hàm lấy các cuộc trò chuyện của người dùng
  const getUserChats = async () => {
    const currentUserUid = 'PAMTLO25v6coJXXLaS7ngHMekxn1';  // UID của người dùng hiện tại
    const userChats = await getChatsByUserId(currentUserUid);

    if (userChats.length > 0) {
      console.log('>>>>>>>\nCác cuộc trò chuyện của người dùng:');
      // Lặp qua tất cả các cuộc trò chuyện và log tất cả tin nhắn
      for (let i = 0; i < userChats.length; i++) {
        const item = userChats[i];

        console.log(`\nThông tin cuộc trò chuyện ${i + 1}:`);

        // Lặp qua tất cả các tin nhắn trong cuộc trò chuyện
        const messageKeys = Object.keys(item.messages);
        messageKeys.forEach((key) => {
          const message = item.messages[key];

          console.log(`Tin nhắn ${key}:`);
          console.log(`- Nội dung: ${message.text}`);
          console.log(`- Người gửi: ${message.senderId}`);
          console.log(`- Thời gian: ${new Date(message.timestamp).toLocaleString()}`);
          console.log(`- Tự hủy: ${message.selfDestruct ? 'Có' : 'Không'}`);
        });

        // Kiểm tra trạng thái gõ
        const typingStatus = item.typing.isTyping ? 'Đang gõ...' : 'Không gõ';
        console.log(`Trạng thái gõ: ${typingStatus}`);

        // Log ra người tham gia
        const participants = Object.keys(item.users).join(', ');
        console.log(`Người tham gia: ${participants}`);
      }
    } else {
      console.log('Không có cuộc trò chuyện nào cho người dùng này.');
    }
  };

  // Gọi hàm getUserChats để lấy dữ liệu và log ra thông tin
  useEffect(() => {
    getUserChats();
  }, []);

  return (
    <>
      <AppNavigation />
    </>
  );
};

export default App;
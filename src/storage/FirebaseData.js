import React, {useEffect, useState} from 'react';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const getCurrentUserId = () => {
  const user = auth().currentUser;
  if (user) {
    console.log('User ID của bạn:', user.uid);
    return user.uid;
  } else {
    console.log('Chưa đăng nhập!');
    return null;
  }
};

useEffect(() => {
  getCurrentUserId();
}, []);

const FirebaseData = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    //  Lấy danh sách users từ Firebase
    const reference = database().ref('/users');

    reference.on('value', snapshot => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        setData(usersData);

        //  Gọi hàm lấy tin nhắn cho user đầu tiên (chỉ để thử nghiệm)
        const firstUserId = Object.keys(usersData)[0];
        getUserMessages(firstUserId);
      } else {
        setData(null);
      }
    });

    return () => reference.off('value'); // Hủy lắng nghe khi unmount
  }, []);

  console.log('>>>>>>>>>>>>>>>>>>>>>>>>\n data User', data);

  return null; // Không render UI vì chỉ log dữ liệu
};

//  Hàm lấy tất cả tin nhắn của một user từ Firebase
const getUserMessages = async userId => {
  console.log(` Đang lấy tin nhắn của user: ${userId}`);

  const userMessages = [];

  try {
    // Lấy danh sách các cuộc trò chuyện mà user tham gia
    const chatsSnapshot = await database().ref('/chats').once('value');

    if (chatsSnapshot.exists()) {
      const chats = chatsSnapshot.val();

      for (const chatId in chats) {
        // Kiểm tra nếu user có tham gia cuộc trò chuyện này
        if (chats[chatId].users && chats[chatId].users[userId]) {
          console.log(` User tham gia chat: ${chatId}`);

          // Lấy tất cả tin nhắn từ cuộc trò chuyện đó
          const messagesSnapshot = await database()
            .ref(`/chats/${chatId}/messages`)
            .once('value');

          if (messagesSnapshot.exists()) {
            const messages = messagesSnapshot.val();
            for (const messageId in messages) {
              userMessages.push({
                chatId,
                messageId,
                senderId: messages[messageId].senderId,
                text: atob(messages[messageId].text), // Giải mã nội dung nếu mã hóa Base64
                timestamp: new Date(
                  messages[messageId].timestamp,
                ).toLocaleString(),
              });
            }
          }
        }
      }
    }

    console.log(' Tin nhắn của user:', userMessages);
  } catch (error) {
    console.log(' Lỗi lấy tin nhắn:', error);
  }
};

export default FirebaseData;

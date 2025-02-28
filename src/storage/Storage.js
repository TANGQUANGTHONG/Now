import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { encryptMessage, decryptMessage, generateSecretKey } from '../cryption/Encryption'

// Mỗi khi đăng nhập kiểm tra xem uid có thuộc users trong AsyncStorage không, trùng cập nhập, không thì thêm mới
export const saveCurrentUserAsyncStorage = async () => {
  const user = auth().currentUser;
  if (!user) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  // Tạo đối tượng user mới từ thông tin đăng nhập
  const newUser = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || '',
    nickname: user.displayName || '',  
    image: user.photoURL || '', 
    countChat: 0, 
    createdAt: user.metadata.creationTime || '', 
  };

  try {
    const userRef = database().ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      console.log('Không tìm thấy thông tin user trong database.');
      return;
    }

    const userData = snapshot.val();
    if (!userData || Object.keys(userData).length === 0) {
      console.log('Dữ liệu user không hợp lệ.');
      return;
    }

    // Định dạng user mới
    const newUser = {
      uid: user.uid,
      email: userData.email || '',
      name: userData.name || '',
      nickname: userData.nickname || '',
      image: userData.Image || '',
      countChat: userData.countChat || 0,
      createdAt: userData.createdAt || '',
    };

    // Ghi đè lên user cũ
    await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
    console.log('Lưu user vào AsyncStorage:', newUser);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu từ Firebase:', error);
  }
};
// lấy user
export const getCurrentUserFromStorage = async () => {
  try {
    const userStr = await AsyncStorage.getItem('currentUser');
    if (!userStr) {
      console.log('Không có user nào trong AsyncStorage.');
      return null;
    }
    const user = JSON.parse(userStr);

    const userdecryptMessage={
       email : decryptMessage(user.email),
       name : decryptMessage(user.name),
       image : decryptMessage(user.image),
       nickname : decryptMessage(user.nickname),
    }
    console.log('Lấy user của tao từ AsyncStorage:', userdecryptMessage);
    return userdecryptMessage;
  } catch (error) {
    console.error('Lỗi khi lấy user từ AsyncStorage:', error);
    return null;
  }
};

// xóa user
export const removeCurrentUserFromStorage = async () => {
  try {
    await AsyncStorage.removeItem('currentUser');
    console.log('Xóa user khỏi AsyncStorage.');
  } catch (error) {
    console.error('Lỗi khi xóa user từ AsyncStorage:', error);
  }
};

//Lắng nghe khi chats và messages có thay đổi, kiểm tra chat có uses == uid không, bằng thì kiểm tra xem chat đã tồn tại chưa. Nếu chưa thì thêm mới chat, add các obj messages typing users vào. Ngược lại thêm mới message vào messages. Lưu vào AsynStorage
export const saveChatsAsyncStorage = () => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  // Lấy tham chiếu đến node "chats"
  const chatsRef = database().ref('chats');

  // Hàm dùng chung để cập nhật AsyncStorage với tin nhắn của chat
  const updateChatInAsyncStorage = async (chatId, chatData) => {
    // Lấy tin nhắn mới nhất từ chatData.messages (nếu có)
    const messages = chatData.messages;
    if (!messages || Object.keys(messages).length === 0) return;
    const messageKeys = Object.keys(messages);
    const latestMessageKey = messageKeys[messageKeys.length - 1];
    const latestMessage = messages[latestMessageKey];

    try {
      const existingChatsStr = await AsyncStorage.getItem('chats');
      let chats = existingChatsStr ? JSON.parse(existingChatsStr) : {};

      if (chats[chatId]) {
        // Nếu chat đã tồn tại, thêm hoặc cập nhật message mới mà không ghi đè tin nhắn cũ
        if (!chats[chatId].messages) {
          chats[chatId].messages = {};
        }
        if (!chats[chatId].messages[latestMessageKey]) {
          chats[chatId].messages = {
            ...chats[chatId].messages,
            [latestMessageKey]: {
              selfDestruct: latestMessage.selfDestruct || false,
              senderId: latestMessage.senderId,
              text: latestMessage.text,
              timestamp: latestMessage.timestamp,
            },
          };
          // console.log(`Đã thêm tin nhắn mới vào chat ${chatId}`);
        } else {
          // Nếu tin nhắn đã tồn tại, có thể cập nhật nếu cần
          chats[chatId].messages[latestMessageKey] = {
            selfDestruct: latestMessage.selfDestruct || false,
            senderId: latestMessage.senderId,
            text: latestMessage.text,
            timestamp: latestMessage.timestamp,
          };
          // console.log(`Đã cập nhật tin nhắn trong chat ${chatId}`);
        }
      } else {
        // Nếu chat chưa tồn tại, tạo mới với dữ liệu đầy đủ
        chats[chatId] = {
          messages: {
            [latestMessageKey]: {
              selfDestruct: latestMessage.selfDestruct || false,
              senderId: latestMessage.senderId,
              text: latestMessage.text,
              timestamp: latestMessage.timestamp,
            },
          },
          typing: chatData.typing || {isTyping: false, userId: ''},
          users: chatData.users || {},
        };
        console.log(`Tạo mới chat ${chatId}`);
      }

      // Lưu lại danh sách chats vào AsyncStorage
      await AsyncStorage.setItem('chats', JSON.stringify(chats));
      // console.log(`Chats sau khi cập nhật cho chat ${chatId}:`, chats[chatId]);
    } catch (error) {
      console.error(`Lỗi cập nhật AsyncStorage cho chat ${chatId}:`, error);
    }
  };

  // Lắng nghe sự kiện "child_added" trên node "chats" (chat mới được tạo)
  chatsRef.on('child_added', chatSnapshot => {
    const chatId = chatSnapshot.key;
    const chatData = chatSnapshot.val();

    // Kiểm tra xem trường "users" của chat có chứa UID của user hiện tại không
    if (!chatData.users || !chatData.users[currentUser.uid]) {
      // console.log(`Chat ${chatId} không liên quan đến user ${currentUser.uid}`);
      return;
    }

    // console.log(`Chat mới ${chatId} được thêm, bắt đầu lắng nghe tin nhắn...`);
    const messagesRef = database().ref(`chats/${chatId}/messages`);

    // Lắng nghe tin nhắn mới được thêm vào chat (child_added)
    messagesRef.on('child_added', async messageSnapshot => {
      // console.log(
      //   `child_added event tại chat ${chatId}:`,
      //   messageSnapshot.key,
      //   messageSnapshot.val(),
      // );
      // Gọi hàm cập nhật AsyncStorage cho chat này
      await updateChatInAsyncStorage(chatId, {
        ...chatData,
        messages: {
          ...chatData.messages,
          [messageSnapshot.key]: messageSnapshot.val(),
        },
      });
    });

    // Lắng nghe thay đổi tin nhắn (child_changed)
    messagesRef.on('child_changed', async messageSnapshot => {
      // console.log(
      //   `child_changed event tại chat ${chatId}:`,
      //   messageSnapshot.key,
      //   messageSnapshot.val(),
      // );
      await updateChatInAsyncStorage(chatId, {
        ...chatData,
        messages: {
          ...chatData.messages,
          [messageSnapshot.key]: messageSnapshot.val(),
        },
      });
    });
  });

  // Cũng có thể lắng nghe "child_changed" trên node "chats" để bắt những thay đổi khác (typing, users) của chat đã tồn tại
  chatsRef.on('child_changed', async chatSnapshot => {
    const chatId = chatSnapshot.key;
    const chatData = chatSnapshot.val();

    // Kiểm tra nếu user hiện tại có trong chat này
    if (!chatData.users || !chatData.users[currentUser.uid]) {
      // console.log(`Chat ${chatId} không liên quan đến user ${currentUser.uid}`);
      return;
    }

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>. \n \tThêm mới chat trong asynStorage ${chatId}:`,
      chatData,
    );
    // Cập nhật toàn bộ chat (bao gồm typing, users, và messages)
    await updateChatInAsyncStorage(chatId, chatData);
  });
};

//Lắng nghe khi chats có thay đôi, kiểm tra chat có [idUser] thuộc  usess == uid không, không bằng thì bỏ qua. Nếu bằng thì kiểm tra xem [idUser] thuộc  usess còn lại == với iduser thuộc userSend. Nếu chưa thì thêm mới user vào usersSend. còn lại thì bỏ qua.
export const saveUserSendAsyncStorage = () => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  const chatsRef = database().ref('chats');

  // Lắng nghe sự kiện "child_added" trên node "chats"
  chatsRef.on('child_added', async snapshot => {
    const chatId = snapshot.key;
    const chatData = snapshot.val();

    if (!chatData || !chatData.users) {
      console.log(`Không có trường "users" trong chatId=${chatId}`);
      return;
    }

    // Lấy danh sách userId từ chatData.users
    const userIds = Object.keys(chatData.users);

    // Kiểm tra xem chat có liên quan đến user hiện tại không
    if (!userIds.includes(currentUser.uid)) {
      console.log(`Chat ${chatId} không liên quan đến user ${currentUser.uid}`);
      return;
    }

    console.log(`Chat ${chatId} mới được thêm, danh sách users:`, userIds);

    try {
      // Lấy danh sách user đã lưu trong AsyncStorage (key "usersSend")
      const existingUsersStr = await AsyncStorage.getItem('usersSend');
      let usersArray = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      // Duyệt qua từng userId
      for (const userId of userIds) {
        // Kiểm tra xem user này đã có trong "usersSend" chưa
        if (usersArray.some(u => u.uid === userId)) {
          // console.log(`UserId=${userId} đã có trong "usersSend", bỏ qua.`);
          continue;
        }

        // Nếu chưa có, fetch dữ liệu user từ "users/{userId}"
        try {
          const userRef = database().ref(`users/${userId}`);
          const userSnap = await userRef.once('value');
          if (!userSnap.exists()) {
            console.log(
              `Không tìm thấy thông tin userId=${userId} trong "users".`,
            );
            continue;
          }

          const userData = userSnap.val();
          const newUser = {
            uid: userId,
            email: userData.email || '',
            name: userData.name || '',
            nickname: userData.nickname || '',
            image: userData.image || '',
            countChat: userData.countChat || 0,
            createdAt: userData.createdAt || '',
          };

          usersArray.push(newUser);
          console.log(`Đã thêm userId=${userId} vào "usersSend".`);
        } catch (err) {
          console.error(`Lỗi khi fetch dữ liệu userId=${userId}:`, err);
        }
      }

      // Lưu lại danh sách usersSend vào AsyncStorage
      await AsyncStorage.setItem('usersSend', JSON.stringify(usersArray));
      console.log(
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..\n \tCập nhật 'usersSend' thành công:",
        usersArray,
      );
    } catch (error) {
      console.error(`Lỗi xử lý user mới trong chatId=${chatId}:`, error);
    }
  });
};

////////////// lấy dữ liệu từ AsyncStorage

// Lấy danh sách users từ AsyncStorage
export const getAllSavedUsersAsyncStorage = async () => {
  try {
    const users = await AsyncStorage.getItem('users');

    if (!users) {
      console.log('Không có users nào được lưu.');
      return [];
    }

    const parsedUsers = JSON.parse(users);
    console.log(
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n \t Danh sách user trong AsyncStorage:',
      parsedUsers,
      '\n  ',
    );
    return parsedUsers;
  } catch (error) {
    console.error('Lỗi lấy danh sách users từ AsyncStorage:', error);
    return [];
  }
};
// Lấy danh sách usersSend từ AsyncStorage
export const getAllUsersFromUserSend = async () => {
  try {
    const usersStr = await AsyncStorage.getItem('usersSend');
    if (!usersStr) {
      console.log('Không có dữ liệu trong usersSend.');
      return [];
    }
    const usersArray = JSON.parse(usersStr);
    console.log('Danh sách users trong usersSend:', usersArray);
    return usersArray;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users từ usersSend:', error);
    return [];
  }
};
// Lấy danh sách chats từ AsyncStorage
export const getAllChatsAsyncStorage = async () => {
  try {
    const chats = await AsyncStorage.getItem('chats');
    console.log(
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n \t Danh sách chat trong AsyncStorage:',
      chats ? JSON.parse(chats) : {},
    );
    return chats ? JSON.parse(chats) : {};
  } catch (error) {
    console.error('Lỗi lấy danh sách chats từ AsyncStorage:', error);
    return {};
  }
};
//Lấy dữ liệu user từ usersSend ở AsyncStorage (key usersSend). người gửi
export const getUserFromUserSendById = async idUser => {
  try {
    const existingUsersStr = await AsyncStorage.getItem('usersSend');
    if (!existingUsersStr) {
      console.log('Chưa có danh sách usersSend trong AsyncStorage.');
      return null;
    }

    const usersArray = JSON.parse(existingUsersStr);
    // Tìm user có uid trùng với idUser
    const foundUser = usersArray.find(u => u.uid === idUser);
    if (foundUser) {
      console.log('Đã tìm thấy user:', foundUser);
      return foundUser;
    } else {
      console.log(`Không tìm thấy user với uid=${idUser} trong usersSend.`);
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi lấy user từ usersSend:', error);
    return null;
  }
};

export const getChatsByIdUserAsynStorage = async idUser => {
  try {
    const chatsStr = await AsyncStorage.getItem('chats');
    if (!chatsStr) {
      console.log('Không có chats nào được lưu.');
      return [];
    }

    const chats = JSON.parse(chatsStr);
    // Lọc các chat mà trong "users" có chứa idUser
    const filteredChats = Object.keys(chats).reduce((acc, chatId) => {
      const chat = chats[chatId];
      if (chat.users && chat.users[idUser]) {
        acc[chatId] = chat;
      }
      return acc;
    }, {});

    console.log(`Danh sách chats của user ${idUser}:`, filteredChats);
    const chatArray = Object.entries(filteredChats)
    console.log("danh sach chat",chatArray[0])
    return chatArray;
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chats từ AsyncStorage:', error);
    return [];
  }
};

 const getMessagesFromChats = (chats) => {
  if (!chats || typeof chats !== 'object') {
    console.log('Dữ liệu chats không hợp lệ.');
    return null;
  }

  // Lặp qua các cuộc trò chuyện và lấy messages
  const allMessages = Object.values(chats).flatMap(chat => 
    chat.messages ? Object.entries(chat.messages).map(([messageId, messageData]) => ({
      id: messageId,
      ...messageData
    })) : []
  );
console.log("tao là cảnh",allMessages);
  return allMessages;
};

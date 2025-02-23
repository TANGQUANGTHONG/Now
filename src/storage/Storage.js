import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

// Mỗi khi đăng nhập kiểm tra xem uid có thuộc users trong AsyncStorage không, trùng cập nhập, không thì thêm mới
export const saveCurrentUserAsyncStorage = async () => {
  const user = auth().currentUser;

  if (!user) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  try {
    // Lấy thông tin user từ database
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

    // Tạo đối tượng user mới
    const newUser = {
      uid: user.uid,
      email: user.email,
      name: userData.name || '',
      nickname: userData.nickname || '',
      Image: userData.image || '',
      countChat: userData.countChat || 0,
      createdAt: userData.createdAt || '',
    };

    try {
      // Lấy danh sách user hiện tại từ AsyncStorage
      const existingUsers = await AsyncStorage.getItem('users');
      let usersArray = existingUsers ? JSON.parse(existingUsers) : [];

      // Kiểm tra xem user đã tồn tại trong danh sách chưa
      const userIndex = usersArray.findIndex(u => u.uid === newUser.uid);

      if (userIndex !== -1) {
        // Nếu user đã tồn tại, ghi đè dữ liệu mới
        usersArray[userIndex] = newUser;
        console.log(
          '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  \n \tUser đã tồn tại, cập nhật thông tin.\n',
        );
      } else {
        // Nếu user chưa tồn tại, thêm mới
        usersArray.push(newUser);
        console.log(
          '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  \n \t User mới đã được thêm vào danh sách.\n',
        );
      }

      // Lưu lại danh sách user vào AsyncStorage
      await AsyncStorage.setItem('users', JSON.stringify(usersArray));
      console.log(
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  \n \t Danh sách user sau khi cập nhật:',
        usersArray,
        '\n ',
      );
    } catch (storageError) {
      console.error('Lỗi lưu danh sách user vào AsyncStorage:', storageError);
    }
  } catch (firebaseError) {
    console.error('Lỗi lấy dữ liệu từ Firebase:', firebaseError);
  }
};

// Theo dõi khi có tin nhắn mới được thêm vào Firebase, nếu trùng uid thì kiểm tra chatId có thuộc chats trong asynStorage chưa, trùng thì thêm mới message, không thì tạo mới chat
export const saveChatsAsyncStorage = async () => {
  const user = auth().currentUser;
  if (!user) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  const chatsRef = database().ref('chats');

  chatsRef.on('child_added', async snapshot => {
    const chatId = snapshot.key;
    const chatData = snapshot.val();

    if (!chatData || !chatData.users || !chatData.messages) {
      console.log(`Dữ liệu không hợp lệ cho chatId: ${chatId}`);
      return;
    }

    // Kiểm tra nếu user hiện tại có trong danh sách users của chat này
    if (!chatData.users[user.uid]) {
      console.log(`Chat ${chatId} không liên quan đến user ${user.uid}`);
      return;
    }

    // Lấy tin nhắn mới nhất từ chatData
    const messages = chatData.messages;
    const latestMessageKey = Object.keys(messages).pop();
    const latestMessage = messages[latestMessageKey];

    try {
      const existingChatsStr = await AsyncStorage.getItem('chats');
      let chats = existingChatsStr ? JSON.parse(existingChatsStr) : {};

      if (chats[chatId]) {
        // Nếu chat đã tồn tại, thêm message mới vào phần messages, giữ nguyên message cũ
        chats[chatId].messages = {
          ...chats[chatId].messages,
          [latestMessageKey]: {
            selfDestruct: latestMessage.selfDestruct || false,
            senderId: latestMessage.senderId,
            text: latestMessage.text,
            timestamp: latestMessage.timestamp,
          },
        };
        // Giữ nguyên dữ liệu của typing và users hiện có
        console.log(`Đã thêm tin nhắn mới vào chatId: ${chatId}`);
      } else {
        // Nếu chat chưa tồn tại, tạo mới với đầy đủ dữ liệu
        chats[chatId] = {
          messages: {
            [latestMessageKey]: {
              selfDestruct: latestMessage.selfDestruct || false,
              senderId: latestMessage.senderId,
              text: latestMessage.text,
              timestamp: latestMessage.timestamp,
            },
          },
          typing: {
            isTyping: chatData.typing?.isTyping || false,
            userId: chatData.typing?.userId || '',
          },
          users: chatData.users || {},
        };
        console.log(`Tạo mới chatId: ${chatId}`);
      }

      // Lưu lại danh sách chats vào AsyncStorage
      await AsyncStorage.setItem('chats', JSON.stringify(chats));
      console.log('Chats sau khi cập nhật:', chats);
    } catch (error) {
      console.error(
        `Lỗi khi cập nhật AsyncStorage cho chatId ${chatId}:`,
        error,
      );
    }
  });
};

//Lắng nghe khi "chats/{chatId}" thay đổi (child_changed).Nếu có user mới trong "chats/{chatId}/users" và user hiện tại có trong chat, kiểm tra userSend. Nếu user chưa có trong userSend, fetch từ "users/{userId}" và thêm vào.
export const saveUserSendAsyncStorage = () => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    console.log('Không có ai đang đăng nhập.');
    return;
  }

  const chatsRef = database().ref('chats');

  chatsRef.on('child_changed', async snapshot => {
    const chatId = snapshot.key;
    const chatData = snapshot.val();

    if (!chatData || !chatData.users) {
      console.log(`Không có trường "users" trong chatId=${chatId}`);
      return;
    }

    // Lấy danh sách userId trong chatData.users
    const userIds = Object.keys(chatData.users);

    // Kiểm tra user hiện tại có trong chat này không
    if (!userIds.includes(currentUser.uid)) {
      console.log(`Chat ${chatId} không liên quan đến user ${currentUser.uid}`);
      return;
    }

    console.log(`Chat ${chatId} đã thay đổi, danh sách users:`, userIds);

    try {
      // Lấy danh sách user đã lưu trong "usersSend"
      const existingUsersStr = await AsyncStorage.getItem('usersSend');
      let usersArray = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      // Duyệt qua từng userId
      for (const userId of userIds) {
        // Nếu không muốn lưu chính mình, bạn có thể bỏ qua
        // if (userId === currentUser.uid) continue;

        // Kiểm tra userId này đã có trong "usersSend" chưa
        const isExist = usersArray.some(u => u.uid === userId);
        if (isExist) {
          console.log(`UserId=${userId} đã tồn tại trong "usersSend", bỏ qua.`);
          continue;
        }

        // Nếu chưa tồn tại, fetch dữ liệu user từ "users/{userId}"
        try {
          const userRef = database().ref(`users/${userId}`);
          const userSnap = await userRef.once('value');
          if (!userSnap.exists()) {
            console.log(
              `Không tìm thấy thông tin userId=${userId} trong "users".`,
            );
            continue;
          }

          // Lấy dữ liệu user
          const userData = userSnap.val();
          // Tạo đối tượng user mới để lưu vào userSend
          const newUser = {
            uid: userId,
            email: userData.email || '',
            name: userData.name || '',
            nickname: userData.nickname || '',
            image: userData.image || '',
            countChat: userData.countChat || 0,
            createdAt: userData.createdAt || '',
          };

          // Thêm user vào mảng
          usersArray.push(newUser);

          console.log(`Đã thêm userId=${userId} vào "usersSend".`);
        } catch (err) {
          console.error(`Lỗi lấy dữ liệu userId=${userId}:`, err);
        }
      }

      // Sau khi thêm tất cả user mới, lưu lại usersArray vào AsyncStorage
      await AsyncStorage.setItem('usersSend', JSON.stringify(usersArray));
      console.log('Cập nhật "usersSend" thành công:', usersArray);
    } catch (error) {
      console.error(`Lỗi xử lý user mới trong chatId=${chatId}:`, error);
    }
  });
};
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
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n \t Danh sách users trong AsyncStorage:',
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
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n \t Danh sách chats trong AsyncStorage:',
      chats ? JSON.parse(chats) : {},
    );
    return chats ? JSON.parse(chats) : {};
  } catch (error) {
    console.error('Lỗi lấy danh sách chats từ AsyncStorage:', error);
    return {};
  }
};
//Lấy dữ liệu user từ usersSend ở AsyncStorage (key usersSend).
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

// Gọi hàm để lưu vào AsyncStorage
export const saveUserDataAsyncStorage = async () => {
  await saveCurrentUserAsyncStorage();
};

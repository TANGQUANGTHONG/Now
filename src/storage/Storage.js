import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {
  generateSecretKey,
  decryptMessage,
  encryptMessage,
} from '../cryption/Encryption';
import {
  getDatabase,
  ref,
  onValue,
  get,
  orderByChild,
  query,
  limitToLast,
} from '@react-native-firebase/database';

// Lấy danh sách người dùng trong các cuộc trò chuyện mà người dùng hiện tại tham gia
export const getUsers = async () => {
  const currentUserId = auth().currentUser?.uid;
  if (!currentUserId) return [];

  const chatRef = ref(getDatabase(), 'chats');

  try {
    const snapshot = await get(chatRef);
    if (!snapshot.exists()) {
      console.log("Không có dữ liệu trong 'chats'");
      return [];
    }

    const chatsData = snapshot.val();
    const chatEntries = Object.entries(chatsData);

    const chatPromises = chatEntries.map(async ([chatId, chat]) => {
      if (!chat.users || !chat.users[currentUserId]) return null;

      const otherUserId = Object.keys(chat.users).find(
        uid => uid !== currentUserId,
      );
      if (!otherUserId) return null;

      const userRef = ref(getDatabase(), `users/${otherUserId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) return null;

      const userInfo = userSnapshot.val();
      const decryptedName = safeDecrypt(
        userInfo?.name,
        otherUserId,
        currentUserId,
      );
      const decryptedImage = safeDecrypt(
        userInfo?.Image,
        otherUserId,
        currentUserId,
      );

      return {
        userId: otherUserId,
        name: decryptedName || 'Người dùng',
        img: decryptedImage || 'https://example.com/default-avatar.png',
      };
    });

    const resolvedUsers = await Promise.all(chatPromises);
    const filteredUsers = resolvedUsers.filter(Boolean);

    //  Lưu danh sách người dùng vào AsyncStorage
    await AsyncStorage.setItem('users', JSON.stringify(filteredUsers));
    console.log(
      'Danh sách người dùng đã được lưu vào AsyncStorage:',
      filteredUsers,
    );

    return filteredUsers;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    return [];
  }
};

// Lấy danh sách các cuộc trò chuyện của người dùng hiện tại
export const getChats = async () => {
  const currentUserId = auth().currentUser?.uid;
  if (!currentUserId) return [];

  const chatRef = ref(getDatabase(), 'chats');

  try {
    const snapshot = await get(chatRef);
    if (!snapshot.exists()) {
      console.log("Không có dữ liệu trong 'chats'");
      return [];
    }

    const chatsData = snapshot.val();
    const chatEntries = Object.entries(chatsData);

    const userChats = chatEntries.filter(
      ([_, chat]) => chat.users?.[currentUserId],
    );

    const chatPromises = userChats.map(async ([chatId, chat]) => {
      const otherUserId = Object.keys(chat.users).find(
        uid => uid !== currentUserId,
      );
      if (!otherUserId) return null;

      const userRef = ref(getDatabase(), `users/${otherUserId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) return null;

      const userInfo = userSnapshot.val();
      const decryptedName = safeDecrypt(
        userInfo?.name,
        otherUserId,
        currentUserId,
      );
      const decryptedImage = safeDecrypt(
        userInfo?.Image,
        otherUserId,
        currentUserId,
      );

      // Lấy tin nhắn mới nhất
      const messagesRef = query(
        ref(getDatabase(), `chats/${chatId}/messages`),
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

    // Lưu danh sách chat vào AsyncStorage
    await AsyncStorage.setItem('chats', JSON.stringify(filteredChats));
    console.log('Danh sách chat đã được lưu vào AsyncStorage:', filteredChats);

    return filteredChats;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chat:', error);
    return [];
  }
};

// Lấy danh sách người dùng từ AsyncStorage
export const fetchUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng từ AsyncStorage:', error);
    return [];
  }
};

// Lấy danh sách cuộc trò chuyện từ AsyncStorage
export const fetchChats = async () => {
  try {
    const storedChats = await AsyncStorage.getItem('chats');
    return storedChats ? JSON.parse(storedChats) : [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chat từ AsyncStorage:', error);
    return [];
  }
};

// Hàm giải mã an toàn
const safeDecrypt = (encryptedText, userId, myId) => {
  try {
    if (!encryptedText) return 'Nội dung trống';

    // Giải mã bằng khóa bí mật của phòng chat
    const decryptedText = decryptMessage(encryptedText, userId, myId);

    // Kiểm tra nếu giải mã thất bại
    if (!decryptedText || decryptedText === 'Lỗi giải mã') {
      return 'Tin nhắn bị mã hóa';
    }

    return decryptedText;
  } catch (error) {
    console.error('Lỗi giải mã:', error);
    return 'Tin nhắn bị mã hóa';
  }
};

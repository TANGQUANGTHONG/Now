import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  LogBox,
  Modal,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {getFirestore} from '@react-native-firebase/firestore';
import {
  encryptMessage,
  decryptMessage,
  generateSecretKey,
  encodeChatId,
} from '../../cryption/Encryption';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {oStackHome} from '../../navigations/HomeNavigation';
import database, {set, onValue, ref} from '@react-native-firebase/database';
import ActionSheet from 'react-native-actionsheet';
import {
  getAllChatsAsyncStorage,
  getAllUsersFromUserSend,
  getChatsByIdUserAsynStorage,
} from '../../storage/Storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {Animated} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const Single = () => {
  const route = useRoute();
  const {
    userId,
    myId,
    username,
    img,
    messages: cachedMessages,
  } = route.params || {}; //lấy các tham số truyền vào từ route , bao gồm userID, myID , username, hình ảnh và tin nhắn đã cache

  const [messages, setMessages] = useState(cachedMessages || []); //State để quản lí tin nhắn, nếu có cache thì lấy từ
  const [text, setText] = useState(''); // State để quản lý nội dung tin nhắn hiện tại
  const navigation = useNavigation();
  const chatId = encodeChatId(userId, myId); // Tạo mã phòng chat dựa trên userId và myId
  const secretKey = generateSecretKey(userId, myId); // Tạo secretKey dùng cho việc mã hóa và giải mã tin nhắn

  const [isSelfDestruct, setIsSelfDestruct] = useState(false); // Theo dõi trạng thái tin nhắn tự hủy
  const [selfDestructTime, setSelfDestructTime] = useState(null); // Thời gian tin nhắn tự hủy sau khi được gửi
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // Theo dõi trạng thái cuộn tin nhắn tự động khi có tin nhắn mới
  const [isTyping, setIsTyping] = useState(false); // Trạng thái người dùng đang nhập tin nhắn
  const [countChat, setcountChat] = useState(); // Số lượt tin nhắn người dùng còn có thể gửi
  const [resetCountdown, setResetCountdown] = useState(null);
  const [timers, setTimers] = useState({});
  const [user, setUser] = useState([]);
  const listRef = useRef(null); // Tham chiếu đến danh sách tin nhắn để thực hiện các hành động như cuộn tự động

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messagene, setMessageNe] = useState([]);
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  const [lastActive, setLastActive] = useState(null);

  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [modal, setModal] = useState(false);
  const [selectedMess, setSelectedMess] = useState(null);
  

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dzlomqxnn/upload'; // URL của Cloudinary để upload ảnh
  const CLOUDINARY_PRESET = 'ml_default'; // Preset của Cloudinary cho việc upload ảnh

  const timeOptions = [
    {label: '5 giây', value: 5},
    {label: '10 giây', value: 10},
    {label: '1 phút', value: 60},
    {label: '5 phút', value: 300},
    {label: 'Tắt tự hủy', value: null},
  ];

 //xóa tin nhắn ở local
 const deleteMessageLocally = async (messageId) => {
  try {
    // Xóa tin nhắn trong Firebase
    await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();

    // Lấy tin nhắn từ AsyncStorage
    const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    let messages = storedMessages ? JSON.parse(storedMessages) : [];

    // Lọc bỏ tin nhắn đã bị xóa
    messages = messages.filter(msg => msg.id !== messageId);

    // Lưu lại danh sách tin nhắn mới vào AsyncStorage
    await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(messages));

    // Cập nhật state để UI phản hồi ngay lập tức
    setMessages(messages);

    console.log(`🗑 Tin nhắn ${messageId} đã bị xóa khỏi Firebase và AsyncStorage.`);
  } catch (error) {
    console.error('❌ Lỗi khi xóa tin nhắn:', error);
  }
};


const recallMessageForBoth = async (messageId) => {
  try {
    const messageRef = database().ref(`/chats/${chatId}/messages/${messageId}`);
    const recallRef = database().ref(`/chats/${chatId}/recalledMessages/${messageId}`);

    // 🔍 Kiểm tra xem tin nhắn còn trong Firebase không
    const snapshot = await messageRef.once('value');
    if (snapshot.exists()) {
      // 🔥 Nếu tin nhắn vẫn còn, xóa ngay lập tức!
      await messageRef.remove();
    }

    // 🔥 Đánh dấu tin nhắn đã bị thu hồi
    await recallRef.set({
      recalled: true,
      timestamp: Date.now(),
    });

    // 📌 Xóa tin nhắn trong AsyncStorage
    const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    let messages = storedMessages ? JSON.parse(storedMessages) : [];

    messages = messages.filter(msg => msg.id !== messageId);
    await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(messages));

    // 🔥 Cập nhật UI ngay lập tức
    setMessages(messages);

    console.log(`🗑 Tin nhắn ${messageId} đã được thu hồi.`);

    // 🚀 Xóa tin nhắn khỏi `/recalledMessages` sau 5 giây để đảm bảo đồng bộ trên cả hai máy
    setTimeout(async () => {
      await recallRef.remove();
      console.log(`🗑 Tin nhắn ${messageId} đã bị xóa khỏi /recalledMessages.`);
    }, 5000);
    
  } catch (error) {
    console.error("❌ Lỗi khi thu hồi tin nhắn:", error);
  }
};


  //Lắng nghe Firebase để cập nhật UI khi tin nhắn bị thu hồi
  useEffect(() => {
    const recallRef = database().ref(`/chats/${chatId}/recalledMessages`);
  
    const onMessageRecalled = async (snapshot) => {
      if (!snapshot.exists()) return;
  
      try {
        const recalledMessages = snapshot.val();
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        let localMessages = storedMessages ? JSON.parse(storedMessages) : [];
  
        // 🔥 Xóa tin nhắn bị thu hồi khỏi local
        const updatedMessages = localMessages.filter(msg => !recalledMessages[msg.id]);
  
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
  
        // 🔥 Cập nhật UI ngay lập tức
        setMessages(updatedMessages);
  
        // 🚀 Xóa dữ liệu trong `/recalledMessages` sau khi xử lý xong
        Object.keys(recalledMessages).forEach(async (messageId) => {
          const recallMsgRef = database().ref(`/chats/${chatId}/recalledMessages/${messageId}`);
          setTimeout(async () => {
            await recallMsgRef.remove();
            console.log(`🗑 Tin nhắn ${messageId} đã bị xóa khỏi /recalledMessages.`);
          }, 30000);
        });
  
      } catch (error) {
        console.error("❌ Lỗi khi xử lý tin nhắn thu hồi:", error);
      }
    };
  
    recallRef.on('value', onMessageRecalled);
  
    return () => recallRef.off('value', onMessageRecalled);
  }, [chatId]);
  
  
  

  const handleLongPress = (message) => {
     // Kiểm tra nếu người dùng hiện tại có phải là người gửi tin nhắn hay không
  if (message.senderId !== myId) {
    return;
  }
    setSelectedMess(message); // Lưu tin nhắn đang chọn
    setModal(true); // Hiển thị Modal
  };

  //ghim tin nhan
  const pinMessage = async messageId => {
    try {
      // Lấy tin nhắn trong AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`); // Lấy tin nhắn từ AsyncStorage
      let messages = storedMessages ? JSON.parse(storedMessages) : []; // Nếu có dữ liệu thì parse sang JSON, nếu không thì mảng rỗng

      // Cập nhật trạng thái ghim của tin nhắn
      messages = messages.map(msg =>
        msg.id === messageId ? {...msg, isPinned: true} : msg,
      );

      // Lưu lại vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      // Cập nhật state để UI phản ứng ngay lập tức
      setMessages(messages); // Cập nhật state để giao diện phản ứng ngay lập tức
    } catch (error) {
      console.error('❌ Lỗi khi ghim tin nhắn:', error); // Bắt lỗi nếu có vấn đề trong quá trình ghim tin nhắn
    }
  };

  const unpinMessage = async messageId => {
    try {
      // Lấy tin nhắn trong AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      // Cập nhật trạng thái isPinned thành false cho đúng tin nhắn
      messages = messages.map(msg =>
        msg.id === messageId ? {...msg, isPinned: false} : msg,
      );

      // Lưu lại vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      setMessages(messages); // Cập nhật state để UI phản hồi ngay lập tức
    } catch (error) {
      console.error('❌ Lỗi khi bỏ ghim tin nhắn:', error);
    }
  };

  const handlePinMessage = message => {
    if (message.isPinned) {
      // Nếu tin nhắn đã ghim, mở modal bỏ ghim
      handleUnpinRequest(message);
    } else {
      // Nếu tin nhắn chưa ghim, mở modal ghim
      setSelectedMessage(message);
      setIsPinModalVisible(true);
    }
  };

  const handleUnpinRequest = message => {
    setSelectedMessage(message); // Lưu tin nhắn cần bỏ ghim
    setIsPinModalVisible(true); // Mở modals
  };

  const renderPinnedMessage = ({item}) => {
    return (
      <TouchableOpacity onPress={() => handleUnpinRequest(item)}>
        <View style={styles.pinnedMessageContainer}>
          <Text style={styles.pinnedMessageText}>{item.text}</Text>
          <Text style={styles.pinnedMessageTime}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPinnedMessages = () => {
    const pinnedMessages = messages.filter(msg => msg.isPinned);

    return (
      <FlatList
        data={pinnedMessages}
        keyExtractor={item => item.id}
        renderItem={renderPinnedMessage}
      />
    );
  };

  useEffect(() => {
    const loadMessagesFromStorage = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const messages = storedMessages ? JSON.parse(storedMessages) : [];
        setMessages(messages); // Cập nhật state với tin nhắn từ AsyncStorage
      } catch (error) {
        console.error('❌ Lỗi khi tải tin nhắn từ AsyncStorage:', error);
      }
    };

    loadMessagesFromStorage();
  }, [chatId]); // Chạy lại khi `chatId` thay đổi

  // LogBox.ignoreLogs(['Animated: `useNativeDriver` was not specified']);
  LogBox.ignoreAllLogs();
  console.warn = () => {};
  // console.log("secretKey",secretKey)
  // console.log("userID",userId)
  // 🔹 Lấy tin nhắn realtime
  // animation tin nhắn
  // useEffect(() => {
  //   Animated.timing(fadeAnim, {
  //     toValue: 1,
  //     duration: 500,
  //     useNativeDriver: true,
  //   }).start();
  // }, []);

  //hiển thị trạng thái hoạt động của người dùng
  useEffect(() => {
    const updateLastActive = async () => {
      const userRef = database().ref(`/users/${myId}/lastActive`);
      await userRef.set(database.ServerValue.TIMESTAMP);
    };

    updateLastActive();

    const interval = setInterval(updateLastActive, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [myId]);

  //Lắng nghe thay đổi trạng thái hoạt động của người dùng khác và cập nhật giao diện người dùng
  useEffect(() => {
    const userRef = database().ref(`/users/${userId}/lastActive`);

    const onUserActiveChange = snapshot => {
      if (snapshot.exists()) {
        const lastActive = snapshot.val();
        setLastActive(lastActive);
      }
    };

    userRef.on('value', onUserActiveChange);

    return () => userRef.off('value', onUserActiveChange);
  }, [userId]);

  //Hàm tính toán và hiển thị trạng thái hoạt động của user
  const getStatusText = () => {
    if (!lastActive) return 'Đang hoạt động';

    const now = Date.now();
    const diff = now - lastActive;

    if (diff < 60000) return 'Đang hoạt động';
    if (diff < 3600000)
      return `Hoạt động ${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000)
      return `Hoạt động ${Math.floor(diff / 3600000)} giờ trước`;

    return `Hoạt động ${Math.floor(diff / 86400000)} ngày trước`;
  };

  // lấy dữ liệu từ firebase về để show lên
  useEffect(() => {
    const typingRef = database().ref(`/chats/${chatId}/typing`);
    const messagesRef = database().ref(`/chats/${chatId}/messages`);

    // Lắng nghe trạng thái đang nhập
    const onTypingChange = snapshot => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();
        setIsTyping(typingData.isTyping && typingData.userId !== myId);
      } else {
        setIsTyping(false);
      }
    };

    // Lắng nghe tin nhắn mới
    const onMessageChange = async snapshot => {
      if (!snapshot.exists()) return;

      try {
        const firebaseMessages = snapshot.val();
        if (!firebaseMessages) return;

        const newMessages = Object.entries(firebaseMessages)
          .map(([id, data]) => ({
            id,
            senderId: data.senderId,
            text: data.text
              ? decryptMessage(data.text, secretKey)
              : '📷 Ảnh mới',
            imageUrl: data.imageUrl || null,
            timestamp: data.timestamp,
            selfDestruct: data.selfDestruct || false,
            selfDestructTime: data.selfDestructTime || null,
            seen: data.seen || {},
            deleted: data.deleted || false,
          }))
          .filter(msg => msg.timestamp) // Lọc tin nhắn hợp lệ
          .sort((a, b) => a.timestamp - b.timestamp); // 🔹 Sắp xếp theo timestamp

        console.log('📩 Tin nhắn mới từ Firebase:', newMessages);

        // Lọc tin nhắn không tự hủy
        // const nonSelfDestructMessages = newMessages.filter(
        //   msg => !msg.selfDestruct,
        // );

        // Lấy tin nhắn cũ từ AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

        // Gộp tin nhắn mới với tin nhắn cũ, loại bỏ trùng lặp
        const updatedMessages = [...oldMessages, ...newMessages]
          .filter(
            (msg, index, self) =>
              index === self.findIndex(m => m.id === msg.id),
          )
          .sort((a, b) => a.timestamp - b.timestamp); // 🔹 Sắp xếp tin nhắn theo timestamp

        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(updatedMessages),
        );

        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(updatedMessages),
        );

        // Cập nhật UI với tin nhắn mới
        const uniqueMessages = updatedMessages.filter(
          (msg, index, self) => index === self.findIndex(m => m.id === msg.id),
        );
        setMessages(uniqueMessages);

        // Kiểm tra nếu cuộn xuống không bị chặn bởi người dùng
        if (shouldAutoScroll && listRef.current) {
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollToEnd({animated: true});
            }
          }, 300);
        }

        // xóa tin nhắn khi cả 2 đã seen
        for (const msg of newMessages) {
          const seenRef = database().ref(
            `/chats/${chatId}/messages/${msg.id}/seen`,
          );
          await seenRef.child(myId).set(true);

          // Kiểm tra nếu cả hai người đã seen thì xóa tin nhắn
          seenRef.once('value', async snapshot => {
            if (snapshot.exists()) {
              const seenUsers = snapshot.val();
              const userIds = Object.keys(seenUsers);
              const allSeen =
                userIds.length === 2 &&
                userIds.every(userId => seenUsers[userId]);

              if (allSeen) {
                console.log(`🗑 Xóa tin nhắn ${msg.id} sau 10 giây`);
                setTimeout(async () => {
                  await database()
                    .ref(`/chats/${chatId}/messages/${msg.id}`)
                    .remove();
                }, 30000);
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn:', error);
      }
    };

    // Đăng ký lắng nghe sự kiện từ Firebase
    typingRef.on('value', onTypingChange);
    messagesRef.on('value', onMessageChange);

    return () => {
      typingRef.off('value', onTypingChange);
      messagesRef.off('value', onMessageChange);
    };
  }, [chatId, secretKey, shouldAutoScroll]);

  //Kiểm tra thời gian và tự động xóa tin nhắn
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers = {};
        messages.forEach(async msg => {
          // Chuyển đổi thành hàm async trong forEach
          if (msg.selfDestruct) {
            const timeLeft = Math.max(
              0,
              Math.floor(
                (msg.timestamp + msg.selfDestructTime * 1000 - Date.now()) /
                  1000,
              ),
            );
            newTimers[msg.id] = timeLeft;

            if (timeLeft === 0) {
              await deleteMessage(msg.id); // Gọi hàm async xóa tin nhắn
            }
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  //hàm xóa tin nhắn dưới local
  const deleteMessage = async messageId => {
    try {
      // Xóa tin nhắn khỏi Firebase
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();

      // Xóa tin nhắn khỏi AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      // Lọc bỏ tin nhắn đã hết thời gian tự hủy
      const updatedMessages = oldMessages.filter(m => m.id !== messageId);

      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(updatedMessages),
      );

      console.log(`🗑 Tin nhắn ${messageId} đã bị xóa khỏi Firebase & local.`);

      // Cập nhật state để UI phản ánh ngay
      setMessages(updatedMessages);
    } catch (error) {
      console.error('❌ Lỗi khi xóa tin nhắn:', error);
    }
  };

  useEffect(() => {
    if (!myId) return;

    const userRef = database().ref(`/users/${myId}/countChat`);
    const fetchUserData = async () => {
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
        setcountChat(snapshot.val());
      }
    };

    fetchUserData();

    return () => userRef.off();
  }, [myId, database]); //  Thêm dependency

  const deleteMessageLocallyAndRemotely = async messageId => {
    try {
      // Xóa tin nhắn trong Firebase
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();

      // Lấy tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      // Lọc bỏ tin nhắn cần xóa
      const updatedMessages = oldMessages.filter(msg => msg.id !== messageId);

      // Cập nhật lại AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(updatedMessages),
      );

      console.log(
        `🗑 Tin nhắn ${messageId} đã bị xóa khỏi Firebase và AsyncStorage.`,
      );
      setMessages(updatedMessages); // Cập nhật UI
    } catch (error) {
      console.error('❌ Lỗi khi xóa tin nhắn:', error);
    }
  };

  //xoa ca hai
  const deleteMessageForBoth = async messageId => {
    try {
      // 🔥 Xóa tin nhắn trong Firebase
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();

      // 🔥 Xóa tin nhắn trong AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      // 🔥 Lọc bỏ tin nhắn vừa bị xóa
      messages = messages.filter(msg => msg.id !== messageId);

      // 🔥 Lưu lại danh sách tin nhắn đã cập nhật vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      // 🔥 Cập nhật state để UI phản hồi ngay lập tức
      setMessages(messages);

      console.log(
        `🗑 Tin nhắn ${messageId} đã bị xóa trên cả Firebase và AsyncStorage.`,
      );
    } catch (error) {
      console.error('❌ Lỗi khi xóa tin nhắn:', error);
    }
  };

  const formatCountdown = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const sendMessage = useCallback(async () => {
    if (!text.trim() || isSending) return; // Kiểm tra nếu tin nhắn rỗng hoặc đang gửi thì chặn gửi

    if (countChat === 0) {
      Alert.alert('Thông báo', 'Bạn đã hết lượt nhắn tin!');
      return;
    }

    setIsSending(true); // Đánh dấu trạng thái đang gửi để tránh spam gửi liên tục

    try {
      const userRef = database().ref(`/users/${myId}`);
      const chatRef = database().ref(`/chats/${chatId}`);

      // Lấy dữ liệu người dùng và kiểm tra nếu cuộc trò chuyện đã tồn tại
      const [userSnapshot, chatSnapshot] = await Promise.all([
        userRef.once('value'),
        chatRef.once('value'),
      ]);

      if (!userSnapshot.exists()) {
        return Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      }

      let {countChat = 100} = userSnapshot.val();

      // Tạo timestamp chung để đảm bảo đồng bộ thời gian giữa các thiết bị
      const timestampRef = database().ref('/timestamp');
      await timestampRef.set(database.ServerValue.TIMESTAMP); // Lưu timestamp hiện tại
      const currentTimestamp = (await timestampRef.once('value')).val(); // Lấy timestamp từ Firebase

      // Nếu cuộc trò chuyện chưa tồn tại, tạo mới
      if (!chatSnapshot.exists()) {
        await chatRef.set({users: {[userId]: true, [myId]: true}});
      }

      // Mã hóa tin nhắn trước khi gửi
      const encryptedText = encryptMessage(text, secretKey);
      const messageRef = chatRef.child('messages').push(); // Tạo reference cho tin nhắn mới
      const messageData = {
        senderId: myId,
        text: encryptedText || '🔒 Tin nhắn mã hóa',
        timestamp: currentTimestamp,
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        seen: {[userId]: false, [myId]: true},
      };

      // Gửi tin nhắn lên Firebase
      await messageRef.set(messageData);

      await userRef.update({countChat: countChat - 1});
      setcountChat(countChat - 1);
      setText(''); // Xóa nội dung nhập vào sau khi gửi

      // Nếu tin nhắn **KHÔNG tự hủy**, lưu vào AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      const updatedMessages = [
        ...oldMessages,
        {id: messageRef.key, ...messageData},
      ];

      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(updatedMessages),
      );
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
    } finally {
      setTimeout(() => setIsSending(false), 1000); // Cho phép gửi lại sau 1 giây
    }
  }, [text, chatId, secretKey, isSelfDestruct, selfDestructTime, isSending]);

  // 🔹 Xác nhận xóa tin nhắn
  const confirmDeleteMessage = messageId => {
    Alert.alert('Xóa tin nhắn', 'Bạn có chắc muốn xóa tin nhắn này?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Xóa', onPress: () => deleteMessageForBoth(messageId)},
    ]);
  };

  //Hàm xử lý khi người dùng đang nhập tin nhắn
  const handleTyping = isTyping => {
    database()
      .ref(`/chats/${chatId}`)
      .update({
        typing: {
          userId: myId,
          isTyping: isTyping,
        },
        users: {[userId]: true, [myId]: true},
      });
  };

  //Hàm xử lý khi người dùng chọn thời gian tự hủy tin nhắn
  const handleSelectTime = selectedTime => {
    if (selectedTime === null) {
      setIsSelfDestruct(false);
      setSelfDestructTime(null);
    } else {
      setSelfDestructTime(selectedTime);
      setIsSelfDestruct(true);
    }
    setIsModalVisible(false); // Đóng modal sau khi chọn
  };

  // useEffect để lấy danh sách người dùng từ AsyncStorage khi component được mount
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getChatsByIdUserAsynStorage();
      // console.log('Dữ  AsyncStorage:', data);
      setUser(data.messages);
    };

    fetchUsers();
  }, []);

  // useEffect để tải danh sách chat từ AsyncStorage và Firebase khi component được mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chatList');
        let chatListFromStorage = storedChats ? JSON.parse(storedChats) : [];

        const currentUserId = auth().currentUser?.uid;
        if (!currentUserId) return;

        const chatRef = database().ref('chats');

        database()
          .ref('chats')
          .on('value', async snapshot => {
            if (!snapshot.exists()) {
              console.log(
                '🔥 Firebase không có dữ liệu, hiển thị từ AsyncStorage.',
              );
              setChatList(chatListFromStorage); //  Nếu Firebase mất dữ liệu, giữ dữ liệu cũ
              return;
            }

            const chatsData = snapshot.val();
            // Lấy dữ liệu của các cuộc trò chuyện từ snapshot Firebase. `snapshot.val()` trả về toàn bộ dữ liệu dưới dạng một đối tượng.

            const chatEntries = Object.entries(chatsData);
            // Chuyển đối tượng `chatsData` thành một mảng các cặp key-value, trong đó key là `chatId` và value là dữ liệu của cuộc trò chuyện.

            const chatPromises = chatEntries.map(async ([chatId, chat]) => {
              // Duyệt qua từng cặp `chatId` và dữ liệu của cuộc trò chuyện `chat`, tạo ra một danh sách các promise xử lý bất đồng bộ cho từng cuộc trò chuyện.

              if (!chat.users || !chat.users[currentUserId]) return null;
              // Kiểm tra xem cuộc trò chuyện có danh sách người dùng hay không và người dùng hiện tại có tham gia cuộc trò chuyện không. Nếu không, bỏ qua cuộc trò chuyện này.

              const otherUserId = Object.keys(chat.users).find(
                uid => uid !== currentUserId,
              );
              // Lấy ID của người dùng còn lại trong cuộc trò chuyện (người mà bạn đang chat) bằng cách lọc ra userId khác với `currentUserId`.

              if (!otherUserId) return null;
              // Nếu không tìm thấy `otherUserId`, bỏ qua cuộc trò chuyện này.

              const secretKey = generateSecretKey(otherUserId, currentUserId);
              // Tạo secretKey cho cuộc trò chuyện dựa trên ID của người dùng khác và ID của người dùng hiện tại, dùng để mã hóa và giải mã tin nhắn.

              const userRef = database().ref(`users/${otherUserId}`);
              // Tạo reference tới thông tin người dùng còn lại trong cuộc trò chuyện (otherUserId) trong cơ sở dữ liệu Firebase.

              const userSnapshot = await userRef.once('value');
              // Lấy dữ liệu của người dùng khác từ Firebase chỉ một lần (không theo dõi thời gian thực).

              if (!userSnapshot.exists()) return null;
              // Nếu dữ liệu người dùng không tồn tại, bỏ qua cuộc trò chuyện này.

              const userInfo = userSnapshot.val();
              // Lấy thông tin chi tiết của người dùng khác từ snapshot.

              const decryptedName = safeDecrypt(userInfo?.name);
              // Giải mã tên của người dùng khác (nếu có) bằng cách sử dụng hàm `safeDecrypt`.

              const decryptedImage = safeDecrypt(userInfo?.Image);
              // Giải mã ảnh đại diện của người dùng khác (nếu có) bằng cách sử dụng hàm `safeDecrypt`.

              let lastMessage = '';
              let lastMessageTime = '';
              let lastMessageTimestamp = 0;
              let unreadCount = 0;
              let lastMessageId = null;
              let isSeen = true;
              // Khởi tạo các biến để lưu trữ thông tin về tin nhắn cuối cùng, thời gian của tin nhắn, số lượng tin nhắn chưa đọc và trạng thái đã xem của tin nhắn.

              const messagesRef = database().ref(`chats/${chatId}/messages`);
              // Tạo reference đến danh sách tin nhắn của cuộc trò chuyện (chatId) trong cơ sở dữ liệu Firebase.

              const messagesSnapshot = await messagesRef.once('value');
              // Lấy dữ liệu của tất cả các tin nhắn trong cuộc trò chuyện từ Firebase chỉ một lần.

              if (messagesSnapshot.exists()) {
                // Kiểm tra xem có tin nhắn nào trong cuộc trò chuyện này không.

                const messagesData = messagesSnapshot.val();
                // Lấy dữ liệu của các tin nhắn từ snapshot.

                const sortedMessages = Object.entries(messagesData)
                  .map(([msgId, msg]) => ({msgId, ...msg}))
                  .sort((a, b) => b.timestamp - a.timestamp);
                // Sắp xếp các tin nhắn theo thứ tự giảm dần dựa trên timestamp (thời gian gửi tin nhắn).

                if (sortedMessages.length > 0) {
                  // Nếu có ít nhất một tin nhắn trong cuộc trò chuyện.

                  const latestMessage = sortedMessages[0];
                  // Lấy tin nhắn mới nhất (tin nhắn đầu tiên sau khi sắp xếp).

                  lastMessageId = latestMessage.msgId;
                  // Lưu lại ID của tin nhắn cuối cùng.

                  lastMessage =
                    decryptMessage(latestMessage.text, secretKey) ||
                    'Tin nhắn bị mã hóa';
                  // Giải mã nội dung tin nhắn cuối cùng bằng cách sử dụng khóa bí mật (secretKey), nếu không giải mã được thì hiển thị thông báo "Tin nhắn bị mã hóa".

                  lastMessageTime = new Date(
                    latestMessage.timestamp,
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  // Chuyển đổi timestamp của tin nhắn cuối cùng thành thời gian định dạng giờ và phút.

                  lastMessageTimestamp = latestMessage.timestamp;
                  // Lưu lại timestamp của tin nhắn cuối cùng.

                  isSeen = latestMessage?.seen?.[currentUserId] || false;
                  // Kiểm tra xem tin nhắn cuối cùng đã được người dùng hiện tại đọc chưa, dựa trên thông tin "seen" của tin nhắn.

                  unreadCount = isSeen
                    ? 0
                    : sortedMessages.filter(
                        msg =>
                          msg.senderId !== currentUserId &&
                          !msg.seen?.[currentUserId],
                      ).length;
                }
              }

              return {
                chatId,
                id: otherUserId,
                name: decryptedName || 'Người dùng',
                img: decryptedImage || 'https://example.com/default-avatar.png',
                text: lastMessage,
                time: lastMessageTime,
                timestamp: lastMessageTimestamp,
                unreadCount,
                lastMessageId,
                isSeen,
              };
              // Trả về đối tượng chứa thông tin cuộc trò chuyện: ID phòng chat, ID người dùng khác, tên, ảnh, tin nhắn cuối cùng, thời gian gửi tin nhắn, số tin nhắn chưa đọc, ID tin nhắn cuối cùng, và trạng thái đã xem.
            });

            const resolvedChats = await Promise.all(chatPromises);
            // Thực thi tất cả các promise lấy thông tin cuộc trò chuyện và đợi tất cả chúng hoàn thành, kết quả là một mảng các cuộc trò chuyện đã được xử lý.

            let filteredChats = resolvedChats
              .filter(Boolean)
              // Lọc bỏ những cuộc trò chuyện không hợp lệ (những giá trị null).

              .sort((a, b) => b.timestamp - a.timestamp);
            // Sắp xếp các cuộc trò chuyện theo thứ tự thời gian, cuộc trò chuyện mới nhất sẽ ở trên cùng.

            if (filteredChats.length === 0) {
              console.log('🔥 Firebase mất dữ liệu, giữ lại danh sách cũ.');
              filteredChats = chatListFromStorage; //  Dùng dữ liệu cũ nếu Firebase mất dữ liệu
            }

            await AsyncStorage.setItem(
              'chatList',
              JSON.stringify(filteredChats),
            );
            setChatList(filteredChats);
            setStorageChanged(prev => !prev);
          });
      } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu:', error);
      }
    };

    loadChats();
  }, []);

  const safeDecrypt = (encryptedText, secretKey) => {
    try {
      if (!encryptedText) return 'Nội dung trống';

      const decryptedText = decryptMessage(encryptedText, secretKey);

      if (!decryptedText || decryptedText === '') {
        return 'Tin nhắn bị mã hóa';
      }

      return decryptedText;
    } catch (error) {
      return 'Tin nhắn bị mã hóa';
    }
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Lỗi', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        uploadImageToCloudinary(imageUri);
      }
    });
  };

  const uploadImageToCloudinary = async imageUri => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        console.log('✅ Ảnh đã tải lên Cloudinary:', data.secure_url);
        sendImageMessage(data.secure_url);
      } else {
        throw new Error('Lỗi khi tải ảnh lên Cloudinary');
      }
    } catch (error) {
      console.error('❌ Lỗi khi upload ảnh:', error);
    }
  };

  const sendImageMessage = async imageUrl => {
    if (!imageUrl || isSending) return; // Ngăn gửi nếu đang xử lý gửi ảnh
    setIsSending(true);

    try {
      const chatRef = database().ref(`/chats/${chatId}/messages`).push();
      const timestamp = Date.now();

      const messageData = {
        senderId: myId,
        imageUrl: imageUrl,
        timestamp: timestamp,
        seen: {[myId]: true, [userId]: false},
        selfDestruct: isSelfDestruct, // Áp dụng tự hủy nếu bật
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
      };

      await chatRef.set(messageData);
      console.log('✅ Ảnh đã gửi vào Firebase:', imageUrl);

      // 🔥 Lưu tin nhắn ảnh vào AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      //fix lai x2 anh
      // const updatedMessages = [
      //   ...oldMessages,
      //   { id: chatRef.key, ...messageData },
      // ];

      // await AsyncStorage.setItem(
      //   `messages_${chatId}`,
      //   JSON.stringify(updatedMessages),
      // );

      // // Cập nhật UI ngay lập tức
      // setMessages(updatedMessages);
      await chatRef.set(messageData);
      setIsSending(false);

      //
    } catch (error) {
      console.error('❌ Lỗi khi gửi ảnh:', error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.navigate(oStackHome.TabHome.name)}
              style={styles.backButton}>
              <Icon name="arrow-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Image source={{uri: img}} style={styles.headerAvatar} />
              <View>
                <Text style={styles.headerUsername}>{username}</Text>
                <View style={styles.statusContainer}>
                  {getStatusText() === 'Đang hoạt động' && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.userStatus}>{getStatusText()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chatStatus}>
              {countChat > 0 ? (
                <Text style={styles.chatCountText}>
                  {countChat} lượt nhắn tin
                </Text>
              ) : (
                <Text style={styles.resetText}>
                  Reset sau {formatCountdown(resetCountdown)}
                </Text>
              )}
            </View>
          </View>
          {renderPinnedMessages()}
        </View>
        <FlatList
          ref={listRef}
          data={[...messages].sort((a, b) => a.timestamp - b.timestamp)} // 🔹 Đảm bảo sắp xếp đúng
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const isSentByMe = item.senderId === myId;
            const isSelfDestruct = item.selfDestruct;
            const selfDestructTime = item.selfDestructTime;
            const timestamp = item.timestamp;

            // Tính thời gian còn lại trước khi xóa
            const expirationTime = timestamp + selfDestructTime * 1000;
            const timeLeft = isSelfDestruct
              ? Math.max(0, Math.floor((expirationTime - Date.now()) / 1000))
              : null;

            return (
              <View style={{flexDirection: 'column'}}>
                <View
                  style={
                    isSentByMe ? styles.sentWrapper : styles.receivedWrapper
                  }>
                  {/* Hiển thị Avatar nếu là tin nhắn của người khác */}
                  {!isSentByMe && (
                    <Image source={{uri: img}} style={styles.avatar} />
                  )}

                  <TouchableOpacity
                    onPress={() => handlePinMessage(item)}
                    onLongPress={() => handleLongPress(item)}
                    style={[
                      isSentByMe
                        ? styles.sentContainer
                        : styles.receivedContainer,
                      isSelfDestruct && styles.selfDestructMessage,
                    ]}>
                    {/* Hiển thị tên người gửi nếu là tin nhắn của người khác */}
                    {!isSentByMe && (
                      <Text style={styles.usernameText}>{username}</Text>
                    )}

                    {/* Nếu tin nhắn là ảnh */}
                    {item.imageUrl ? (
                      isSelfDestruct ? ( // Chỉ đếm ngược nếu ảnh có chế độ tự hủy
                        timeLeft > 0 ? (
                          <View>
                            <Image
                              source={{uri: item.imageUrl}}
                              style={styles.imageMessage}
                            />
                            <Text style={styles.selfDestructTimer}>
                              🕒 {timeLeft}s
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.deletedText}>
                            🔒 Ảnh đã bị xóa
                          </Text>
                        )
                      ) : (
                        <Image
                          source={{uri: item.imageUrl}}
                          style={styles.imageMessage}
                        />
                      )
                    ) : // Nếu không phải tin nhắn ảnh, hiển thị văn bản
                    isSelfDestruct ? (
                      timeLeft > 0 ? (
                        <View>
                          <Text style={styles.TextselfDestructTimer}>
                            {item.text}
                          </Text>
                          <Text style={styles.selfDestructTimer}>
                            🕒 {timeLeft}s
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.deletedText}>
                          🔒 Tin nhắn đã bị xóa
                        </Text>
                      )
                    ) : (
                      <Text
                        style={
                          isSentByMe
                            ? styles.SendmessageText
                            : styles.ReceivedmessageText
                        }>
                        {item.text}
                      </Text>
                    )}

                    {/* Hiển thị thời gian gửi tin nhắn */}
                    <Text
                      style={
                        isSentByMe
                          ? styles.Sendtimestamp
                          : styles.Revecivedtimestamp
                      }>
                      {new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        <FlatList
          data={user}
          keyExtractor={item => item.id} // Đảm bảo ID là string
          renderItem={({item}) => <Text>{item.text}</Text>}
        />

        {isTyping && <Text style={styles.typingText}>Đang nhập...</Text>}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={{
              padding: 10,
              backgroundColor: '#f5f5f5',
              borderRadius: 10,
              alignItems: 'center',
            }}>
            <Icon
              name={isSelfDestruct ? 'timer-sand' : 'timer-off'}
              size={24}
              color={isSelfDestruct ? 'red' : '#007bff'}
            />
            <Text>{selfDestructTime ? `${selfDestructTime}s` : 'Tắt'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <Icon name="image" size={24} color="#007bff" />
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn thời gian tự hủy</Text>
                {timeOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOption}
                    onPress={() => handleSelectTime(option.value)}>
                    <Text style={styles.modalText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalCancel}>
                  <Text style={styles.modalText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isPinModalVisible}
            onRequestClose={() => setIsPinModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {selectedMessage?.isPinned
                    ? 'Bỏ ghim tin nhắn?'
                    : 'Ghim tin nhắn?'}
                </Text>

                {selectedMessage?.isPinned ? (
                  // Nếu tin nhắn đã ghim, hiển thị nút bỏ ghim
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      unpinMessage(selectedMessage.id);
                      setIsPinModalVisible(false);
                    }}>
                    <Text style={styles.modalText}>Bỏ ghim</Text>
                  </TouchableOpacity>
                ) : (
                  // Nếu tin nhắn chưa ghim, hiển thị nút ghim
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      pinMessage(selectedMessage.id);
                      setIsPinModalVisible(false);
                    }}>
                    <Text style={styles.modalText}>Ghim</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setIsPinModalVisible(false)}
                  style={styles.modalCancel}>
                  <Text style={styles.modalText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
  animationType="slide"
  transparent={true}
  visible={modal}
  onRequestClose={() => setModal(false)} // Đóng Modal khi bấm ngoài
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Tùy chọn tin nhắn</Text>

      {/* Xóa tin nhắn từ Local */}
      <TouchableOpacity
        style={[styles.modalOption]}
        onPress={() => {
          deleteMessageLocally(selectedMess.id);
          setModal(false); // Đóng Modal
        }}
      >
        <Text style={[styles.modalText, { color: "black" }]}>Xóa chỉ mình tôi</Text>
      </TouchableOpacity>

      {/* Thu hồi tin nhắn trên cả hai thiết bị */}
      <TouchableOpacity
        style={[styles.modalOption]}
        onPress={() => {
          recallMessageForBoth(selectedMess.id);
          setModal(false); // Đóng Modal
        }}
      >
        <Text style={[styles.modalText, { color: "black" }]}>Thu hồi tin nhắn</Text>
      </TouchableOpacity>

      {/* Nút đóng */}
      <TouchableOpacity
        style={styles.modalCancel}
        onPress={() => setModal(false)}
      >
        <Text style={[styles.modalText,{color:'red'}]}>Hủy</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={value => {
                setText(value);
                handleTyping(value.length > 0);
              }}
              placeholder="Nhập tin nhắn..."
              onBlur={() => handleTyping(false)}
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || countChat === 0}
            style={[styles.sendButton, countChat === 0 && {opacity: 0.5}]}>
            <Icon
              name="send"
              size={24}
              color={
                !text.trim() || countChat === 0 || isSending
                  ? '#aaa'
                  : '#007bff'
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'green',
    marginLeft: 5,
  },
  userStatus: {
    marginHorizontal: 5,
    fontSize: 12,
    color: '#888',
  },
  container: {flex: 1, padding: 0, backgroundColor: '#121212'},
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  sentWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  receivedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    marginLeft: 10,
  },
  usernameText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sentContainer: {
    backgroundColor: '#99F2C8',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  receivedContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    marginBottom: 10,
  },

  SendmessageText: {fontSize: 16, color: '#000000'},
  ReceivedmessageText: {fontSize: 16, color: '#0F1828'},
  deletedText: {fontSize: 16, color: '#999', fontStyle: 'italic'},
  Sendtimestamp: {
    fontSize: 12,
    color: '#000000',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  Revecivedtimestamp: {
    fontSize: 12,
    color: '#ADB5BD',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F7F7FC',
    borderRadius: 10,
    marginRight: 10,
  },
  input: {
    fontSize: 16,
    color: '#0F1828',
    padding: 8,
    backgroundColor: '#F7F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  backButton: {
    padding: 5,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#007bff',
    marginLeft: 5,
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    width: '25%',
    borderRadius: 10,
    padding: 2,
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chatCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  resetText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
  },

  seenStatusContainer: {
    alignSelf: 'flex-end', // Để căn phải theo tin nhắn
    marginTop: 2, // Tạo khoảng cách với tin nhắn
    marginRight: 10, // Đẩy sát mép tin nhắn
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalText: {
    fontSize: 16,
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  selfDestructMessage: {
    backgroundColor: '#ffcccb', // Màu đỏ nhạt cho tin nhắn tự hủy
    opacity: 0.8, // Làm mờ tin nhắn để dễ nhận biết
  },
  selfDestructTimer: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'right',
  },

  TextselfDestructTimer: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'right',
  },
  imageButton: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  sentImage: {
    alignSelf: 'flex-end', // Ảnh gửi đi nằm bên phải
  },
  receivedImage: {
    alignSelf: 'flex-start', // Ảnh nhận nằm bên trái
  },
  pinnedMessageContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  pinnedMessageText: {
    fontSize: 16,
    color: 'blue',
  },
  pinnedMessageTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  pinnedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
});

export default Single;
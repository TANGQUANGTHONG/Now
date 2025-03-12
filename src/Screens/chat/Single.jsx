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
  Platform,
  PermissionsAndroid,
  NativeModules,
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
import Clipboard from '@react-native-clipboard/clipboard';
import RNFS from 'react-native-fs';

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
  setSelectedImage;
  const [user, setUser] = useState([]);
  const listRef = useRef(null); // Tham chiếu đến danh sách tin nhắn để thực hiện các hành động như cuộn tự động
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messagene, setMessageNe] = useState([]);
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  const [lastActive, setLastActive] = useState(null);

  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [modal, setModal] = useState(false);
  const [selectedMess, setSelectedMess] = useState(null);

  const [unlockedMessages, setUnlockedMessages] = useState({});
  const [timeLefts, setTimeLefts] = useState({});
  // console.log("time111",timeLefts)

  const {RNMediaScanner} = NativeModules;

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
  const deleteMessageLocally = async messageId => {
    try {
      // Xóa tin nhắn trong Firebase
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();

      // Lấy tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      // Lọc bỏ tin nhắn đã bị xóa
      messages = messages.filter(msg => msg.id !== messageId);

      // Lưu lại danh sách tin nhắn mới vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      // Cập nhật state để UI phản hồi ngay lập tức
      setMessages(messages);

      console.log(
        `🗑 Tin nhắn ${messageId} đã bị xóa khỏi Firebase và AsyncStorage.`,
      );
    } catch (error) {
      console.error('❌ Lỗi khi xóa tin nhắn:', error);
    }
  };

  const recallMessageForBoth = async messageId => {
    try {
      const messageRef = database().ref(
        `/chats/${chatId}/messages/${messageId}`,
      );
      const recallRef = database().ref(
        `/chats/${chatId}/recalledMessages/${messageId}`,
      );

      // 🔍 Kiểm tra tin nhắn có tồn tại không
      const snapshot = await messageRef.once('value');
      if (snapshot.exists()) {
        await messageRef.remove(); // 🔥 Xóa tin nhắn khỏi Firebase
      }

      // 🔥 Lưu thông tin thu hồi vào Firebase
      await recallRef.set({
        recalled: true,
        senderId: myId,
        confirmedBy: {[myId]: true}, // Đánh dấu người gửi đã thu hồi
        seenBy: {}, // 👀 Để theo dõi ai đã thấy tin nhắn thu hồi
        timestamp: Date.now(),
      });

      // ✅ Xóa tin nhắn khỏi AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];
      messages = messages.filter(msg => msg.id !== messageId);
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      setMessages(messages); // 🔄 Cập nhật UI ngay lập tức
    } catch (error) {
      console.error('❌ Lỗi khi thu hồi tin nhắn:', error);
    }
  };

  //Lắng nghe Firebase để cập nhật UI khi tin nhắn bị thu hồi
  useEffect(() => {
    const recallRef = database().ref(`/chats/${chatId}/recalledMessages`);

    const onMessageRecalled = async snapshot => {
      if (!snapshot.exists()) return;

      try {
        const recalledMessages = snapshot.val();
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        let localMessages = storedMessages ? JSON.parse(storedMessages) : [];

        // 🔥 Xóa tin nhắn thu hồi khỏi giao diện Local
        let updatedMessages = localMessages.filter(
          msg => !recalledMessages[msg.id],
        );
        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(updatedMessages),
        );
        setMessages(updatedMessages); // 🔄 Cập nhật UI ngay lập tức

        // ✅ Cập nhật `seenBy` bằng transaction
        for (const messageId of Object.keys(recalledMessages)) {
          const recallMsgRef = database().ref(
            `/chats/${chatId}/recalledMessages/${messageId}`,
          );

          await recallMsgRef.child(`seenBy`).transaction(currentData => {
            return {...currentData, [myId]: true}; // ✅ Ghi nhận thiết bị này đã thấy tin nhắn thu hồi
          });

          // 🔥 Kiểm tra nếu cả hai đã xác nhận thu hồi VÀ đã seen, xóa Firebase
          recallMsgRef.on('value', async msgSnapshot => {
            if (msgSnapshot.exists()) {
              const recallData = msgSnapshot.val();
              const seenUsers = recallData.seenBy || {};

              if (Object.keys(seenUsers).length >= 2) {
                setTimeout(async () => {
                  await recallMsgRef.remove();
                }, 5000);
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn thu hồi:', error);
      }
    };

    recallRef.on('value', onMessageRecalled);

    return () => recallRef.off('value', onMessageRecalled);
  }, [chatId]);

  const handleLongPress = message => {
    // Kiểm tra nếu người dùng hiện tại có phải là người gửi tin nhắn hay không
    // if (message.senderId !== myId) {
    //   return;
    // }
    setSelectedMess(message); // Lưu tin nhắn đang chọn
    setModal(true); // Hiển thị Modal
  };

  const pinMessage = async (messageId, text, timestamp) => {
    try {
      const pinnedRef = database().ref(`/chats/${chatId}/pinnedMessages`);
      const snapshot = await pinnedRef.once('value');
      let pinnedMessages = snapshot.val() || [];

      if (!pinnedMessages.some(msg => msg.messageId === messageId)) {
        pinnedMessages.push({messageId, text, timestamp});
        await pinnedRef.set(pinnedMessages);
      }
    } catch (error) {
      console.error('❌ Lỗi khi ghim tin nhắn:', error);
    }
  };

  const unpinMessage = async messageId => {
    try {
      const pinnedRef = database().ref(`/chats/${chatId}/pinnedMessages`);

      // Lấy danh sách tin nhắn đã ghim từ Firebase
      const snapshot = await pinnedRef.once('value');
      let pinnedMessages = snapshot.val() || [];

      // Xóa tin nhắn cụ thể khỏi danh sách ghim
      pinnedMessages = pinnedMessages.filter(
        msg => msg.messageId !== messageId,
      );
      await pinnedRef.set(pinnedMessages.length > 0 ? pinnedMessages : null);

      // Lấy tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      // Cập nhật trạng thái bỏ ghim trong AsyncStorage
      messages = messages.map(msg =>
        msg.id === messageId ? {...msg, isPinned: false} : msg,
      );
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );

      console.log(`📌 Tin nhắn ${messageId} đã được bỏ ghim.`);
      setMessages(messages); // Cập nhật UI ngay
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

  const renderPinnedMessages = () => {
    const pinnedMessages = messages.filter(msg => msg.isPinned);

    return (
      <FlatList
        data={pinnedMessages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedMessage(item); // Lưu tin nhắn đang chọn
              setIsPinModalVisible(true); // Mở modal xác nhận gỡ ghim
            }}
            style={styles.pinnedMessageContainer}>
            <Text style={styles.pinnedMessageText}>{item.text}</Text>
            <Text style={styles.pinnedMessageTime}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };

  useEffect(() => {
    const pinnedRef = database().ref(`/chats/${chatId}/pinnedMessages`);

    const onPinnedChange = async snapshot => {
      if (!snapshot.exists()) {
        // Nếu không có tin nhắn ghim, xóa trạng thái ghim trong AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        let messages = storedMessages ? JSON.parse(storedMessages) : [];
        messages = messages.map(msg => ({...msg, isPinned: false}));

        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(messages),
        );
        setMessages(messages);
        return;
      }

      // ✅ Lấy danh sách tất cả tin nhắn đã ghim
      const pinnedMessages = snapshot.val() || [];

      // 🔥 Cập nhật trạng thái ghim cho đúng tất cả tin nhắn
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      messages = messages.map(msg => ({
        ...msg,
        isPinned: pinnedMessages.some(pinned => pinned.messageId === msg.id),
      }));

      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );
      setMessages(messages);
    };

    pinnedRef.on('value', onPinnedChange);
    return () => pinnedRef.off('value', onPinnedChange);
  }, [chatId]);

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

  //lắng nghe thay đổi trạng thái hoạt động của người dùng từ Firebase
  useEffect(() => {
    // Tạo tham chiếu đến giá trị "lastActive" của người dùng trong firebase
    const userRef = database().ref(`/users/${userId}/lastActive`);

    // Định nghĩa hàm sẽ được gọi khi giá trị "lastActive" thay đổi
    const onUserActiveChange = snapshot => {
      // Kiểm tra xem giá trị "lastActive" có tồn tại trong snapshot không
      if (snapshot.exists()) {
        // Lấy giá trị lastActive từ Firebase
        const lastActive = snapshot.val();

        // Cập nhật trạng thái lastActive trong local (ứng dụng) với giá trị từ Firebase
        setLastActive(lastActive);
      }
    };

    // Thiết lập lắng nghe sự thay đổi của lastActive trong Firebase
    userRef.on('value', onUserActiveChange);

    // Xóa listener khi component bị hủy hoặc khi userId thay đổi
    return () => userRef.off('value', onUserActiveChange);
  }, [userId]); // Mảng phụ thuộc đảm bảo hàm này chạy lại khi userId thay đổi

  // Hàm tính toán và hiển thị trạng thái hoạt động của người dùng dựa trên thời gian lastActive
  const getStatusText = () => {
    // Nếu không có giá trị lastActive (ví dụ: vừa mới đăng nhập), hiển thị "Đang hoạt động"
    if (!lastActive) return 'Đang hoạt động';

    // Lấy thời gian hiện tại (theo đơn vị milliseconds)
    const now = Date.now();

    // Tính sự chênh lệch giữa thời gian hiện tại và thời gian lastActive
    const diff = now - lastActive;

    // Nếu thời gian chênh lệch dưới 10 giây, hiển thị "Đang hoạt động"
    if (diff < 10000) return 'Đang hoạt động';

    // Nếu thời gian chênh lệch từ 10 giây đến 1 phút, hiển thị "Vừa mới truy cập"
    if (diff < 60000) return 'Vừa mới truy cập';

    // Nếu thời gian chênh lệch từ 1 phút đến 1 giờ, hiển thị số phút trước đó người dùng đã hoạt động
    if (diff < 3600000)
      return `Hoạt động ${Math.floor(diff / 60000)} phút trước`;

    // Nếu thời gian chênh lệch từ 1 giờ đến 24 giờ, hiển thị số giờ trước đó người dùng đã hoạt động
    if (diff < 86400000)
      return `Hoạt động ${Math.floor(diff / 3600000)} giờ trước`;

    // Nếu thời gian chênh lệch lớn hơn 24 giờ, hiển thị số ngày trước đó người dùng đã hoạt động
    return `Hoạt động ${Math.floor(diff / 86400000)} ngày trước`;
  };

  // lấy dữ liệu từ firebase về để show lên
  useEffect(() => {
    const typingRef = database().ref(`/chats/${chatId}/typing`);
    // const messagesRef = database().ref(`/chats/${chatId}/messages`);

    // Lắng nghe trạng thái đang nhập
    const onTypingChange = async  snapshot => {
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
    
        // Chuyển đổi dữ liệu từ object sang mảng
        const newMessages = Object.entries(firebaseMessages).map(([id, data]) => ({
          id,
          senderId: data.senderId,
          text: data.text ? decryptMessage(data.text, secretKey) : '📷 Ảnh mới',
          imageUrl: data.imageUrl || null,
          timestamp: data.timestamp,
          selfDestruct: data.selfDestruct || false,
          selfDestructTime: data.selfDestructTime || null,
          seen: data.seen || {},
          deleted: data.deleted || false,
          isLocked: data.selfDestruct, // 🔒 Mặc định khóa nếu tin nhắn tự hủy
        }));
    
        console.log('📩 Tin nhắn mới từ Firebase:', newMessages);
    
        // 🔥 Lưu ngay vào AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
    
        // Gộp tin nhắn mới với tin cũ, tránh trùng lặp
        const updatedMessages = [...oldMessages, ...newMessages]
          .filter((msg, index, self) => index === self.findIndex(m => m.id === msg.id))
          .sort((a, b) => a.timestamp - b.timestamp);
    
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    
        console.log('✅ Tin nhắn mới đã lưu vào AsyncStorage!');
    
        // Cập nhật state UI
        setMessages(updatedMessages);
      } catch (error) {
        console.error('❌ Lỗi khi lưu tin nhắn mới vào AsyncStorage:', error);
      }
    };
    

    // Đăng ký lắng nghe sự kiện từ Firebase
    typingRef.on('value', onTypingChange);
    // messagesRef.on('value', onMessageChange);

    return () => {
      typingRef.off('value', onTypingChange);
      // messagesRef.off('value', onMessageChange);
    };
  }, [chatId, secretKey, shouldAutoScroll]);

  //Kiểm tra thời gian và tự động xóa tin nhắn
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLefts(prev => {
        let updatedTimers = { ...prev };
        
        Object.keys(prev).forEach(messageId => {
          if (prev[messageId] > 0) {
            updatedTimers[messageId] = prev[messageId] - 1;
          } else if (prev[messageId] === 0) {
            deleteMessage(messageId); // Xóa tin nhắn khi hết thời gian
            delete updatedTimers[messageId]; // Xóa khỏi `timeLefts`
          }
        });
  
        // console.log("LOG timeLefts: ", updatedTimers); // ✅ Kiểm tra giá trị
        return updatedTimers;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);
  
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
        isLocked: isSelfDestruct, // 🔒 Chỉ khóa nếu tin nhắn tự hủy: isSelfDestruct,
      };

      // Gửi tin nhắn lên Firebase
      await messageRef.set(messageData);
      setText('');

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
  /////////////////////////////////////////////////////////////////////////////////////////////////
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

  // Hàm gửi tin nhắn ảnh
  const sendImageMessage = async imageUrl => {
    // Kiểm tra nếu URL ảnh không tồn tại hoặc đang gửi ảnh thì không làm gì và thoát khỏi hàm
    if (!imageUrl || isSending) return;
    // Đặt trạng thái isSending thành true để tránh gửi liên tục nhiều ảnh trong khi đang xử lý
    setIsSending(true);

    try {
      // Tạo một reference mới trong Firebase Realtime Database cho tin nhắn ảnh
      const chatRef = database().ref(`/chats/${chatId}/messages`).push();
      // Lấy timestamp hiện tại để lưu lại thời gian gửi tin nhắn
      const timestamp = Date.now();

      // Tạo dữ liệu cho tin nhắn ảnh
      const messageData = {
        senderId: myId, // ID của người gửi
        imageUrl: imageUrl, // URL của ảnh đã chọn
        timestamp: timestamp, // Thời gian gửi tin nhắn
        seen: {[myId]: true, [userId]: false}, // Trạng thái đã xem của tin nhắn (người gửi đã xem, người nhận chưa xem)
        selfDestruct: isSelfDestruct, // Kiểm tra xem tin nhắn có chế độ tự hủy không
        selfDestructTime: isSelfDestruct ? selfDestructTime : null, // Nếu tự hủy bật, thì lưu thời gian tự hủy
      };

      // Gửi tin nhắn ảnh lên Firebase bằng cách lưu dữ liệu vào reference đã tạo
      await chatRef.set(messageData);
      console.log('✅ Ảnh đã gửi vào Firebase:', imageUrl); // In ra console URL ảnh đã gửi

      // 🔥 Lấy các tin nhắn cũ từ AsyncStorage để chuẩn bị cập nhật danh sách tin nhắn
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : []; // Chuyển đổi dữ liệu lưu trữ từ chuỗi JSON thành mảng tin nhắn cũ

      // (Đoạn này bị comment out) Gộp tin nhắn ảnh mới với các tin nhắn cũ
      // const updatedMessages = [
      //   ...oldMessages,
      //   { id: chatRef.key, ...messageData }, // Thêm tin nhắn mới vào danh sách
      // ];

      // (Đoạn này bị comment out) Lưu lại danh sách tin nhắn đã cập nhật vào AsyncStorage
      // await AsyncStorage.setItem(
      //   `messages_${chatId}`,
      //   JSON.stringify(updatedMessages),
      // );

      // (Đoạn này bị comment out) Cập nhật giao diện với danh sách tin nhắn mới
      // setMessages(updatedMessages);

      // Đảm bảo dữ liệu tin nhắn ảnh được lưu vào Firebase (có thể do double-setting trước đó)
      await chatRef.set(messageData);
      // Sau khi gửi xong, đặt lại trạng thái isSending thành false để có thể gửi tin nhắn tiếp theo
      setIsSending(false);
    } catch (error) {
      // Nếu có lỗi xảy ra trong quá trình gửi ảnh, in lỗi ra console
      console.error('❌ Lỗi khi gửi ảnh:', error);
    } finally {
      // Đảm bảo trạng thái isSending được đặt lại sau 1 giây, cho dù có lỗi hay không
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  const handleUnlockMessage = async (messageId, selfDestructTime) => {
    setUnlockedMessages(prev => ({ ...prev, [messageId]: true }));
  
    // ✅ Cập nhật Firebase để mở khóa tin nhắn
    await database().ref(`/chats/${chatId}/messages/${messageId}`).update({
      isLocked: false,
    });
  
    // ✅ Bắt đầu đếm ngược nếu chưa có giá trị
    setTimeLefts(prev => ({
      ...prev,
      [messageId]: prev[messageId] !== undefined ? prev[messageId] : selfDestructTime,
    }));
  };
  
  

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // Android 13+ (API 33+): Dùng quyền READ_MEDIA_IMAGES
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Quyền truy cập ảnh',
              message: 'Ứng dụng cần quyền để lưu ảnh về thiết bị.',
              buttonNeutral: 'Hỏi lại sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Cho phép',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else if (Platform.Version >= 29) {
          // Android 10+ (API 29+): Dùng Scoped Storage
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Quyền lưu trữ ảnh',
              message: 'Ứng dụng cần quyền để tải ảnh về thiết bị.',
              buttonNeutral: 'Hỏi lại sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Cho phép',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 9 trở xuống
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);
          return (
            granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED
          );
        }
      } catch (err) {
        console.warn('Lỗi khi xin quyền:', err);
        return false;
      }
    }
    return true; // iOS không cần quyền
  };

  const downloadImage = async imageUrl => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Lỗi', 'Bạn cần cấp quyền để tải ảnh.');
        return;
      }
      // Lấy tên file từ URL
      const fileName = imageUrl.split('/').pop();
      const downloadPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}` // ✅ Sửa lại dấu backtick
          : `${RNFS.DocumentDirectoryPath}/${fileName}`; // ✅ Sửa lại dấu backtick

      const download = RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: downloadPath,
      });

      await download.promise;

      // 🔄 Gọi hàm làm mới thư viện ảnh
      await refreshGallery(downloadPath);

      Alert.alert('Thành công', 'Ảnh đã tải về thư viện!');
      console.log('📂 Ảnh đang được lưu vào:', downloadPath);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải ảnh.');
      console.error('❌ Lỗi khi tải ảnh:', error);
    }
  };

  //f5 lại cho có ảnh trong thư viện
  const refreshGallery = async filePath => {
    if (Platform.OS === 'android' && RNMediaScanner) {
      try {
        await RNMediaScanner.scanFile(filePath);
        console.log('✅ Thư viện đã cập nhật:', filePath);
      } catch (err) {
        console.warn('⚠️ Lỗi cập nhật thư viện:', err);
      }
    } else {
      console.warn('⚠️ RNMediaScanner không khả dụng trên nền tảng này.');
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
            const messageId = item.id;

            // ✅ Lấy thời gian còn lại từ state
            // const timeLeft = isSelfDestruct && !item.isLocked
            // ? (timeLefts[item.id] !== undefined && timeLefts[item.id] !== null
            //     ? timeLefts[item.id]
            //     : selfDestructTime)
            // : null;
          
            const timeLeft = timeLefts[item.id] !== undefined ? timeLefts[item.id] : item.selfDestructTime;
            console.log("timeLeft", timeLeft); // ✅ Kiểm tra giá trị chính xác

            return (
              <View style={{flexDirection: 'column'}}>
                <View
                  style={
                    isSentByMe ? styles.sentWrapper : styles.receivedWrapper
                  }>
                  {!isSentByMe && (
                    <Image source={{uri: img}} style={styles.avatar} />
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (item.isLocked) {
                        handleUnlockMessage(item.id, selfDestructTime);
                      }
                    }}
                    onLongPress={() => handleLongPress(item)}
                    style={[
                      isSentByMe
                        ? styles.sentContainer
                        : styles.receivedContainer,
                      isSelfDestruct && styles.selfDestructMessage,
                    ]}>
                    {!isSentByMe && (
                      <Text style={styles.usernameText}>{username}</Text>
                    )}

                    {/* 🔒 Nếu tin nhắn bị khóa, hiển thị "Nhấn để mở khóa" */}
                    {isSelfDestruct &&
                    item.isLocked &&
                    !unlockedMessages[item.id] ? (
                      <Text style={styles.lockedMessage}>
                        🔒 Nhấn để mở khóa
                      </Text>
                    ) : (
                      <>
                        {/* Nếu tin nhắn là ảnh */}
                        {item.imageUrl ? (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedImage(item.imageUrl);
                              setIsImageModalVisible(true);
                            }}>
                            <Image
                              source={{uri: item.imageUrl}}
                              style={styles.imageMessage}
                            />
                          </TouchableOpacity>
                        ) : (
                          <>
                            {/* ✅ Hiển thị nội dung tin nhắn khi không bị khóa */}
                            <Text
                              style={
                                isSentByMe
                                  ? styles.SendmessageText
                                  : styles.ReceivedmessageText
                              }>
                              {item.text}
                            </Text>

                            {/* ✅ Hiển thị thời gian tự hủy nếu tin nhắn đã mở khóa */}
                            {isSelfDestruct &&
                              timeLeft > 0 && (
                                <Text style={styles.selfDestructTimer}>
                                  🕒 {timeLeft}s
                                </Text>
                              )}
                          </>
                        )}
                      </>
                    )}

                    {/* Hiển thị thời gian gửi tin nhắn */}
                    <Text
                      style={
                        isSentByMe
                          ? styles.Sendtimestamp
                          : styles.Revecivedtimestamp
                      }>
                      {new Date(item.timestamp).toLocaleTimeString([], {
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
            onRequestClose={() => setModal(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Tùy chọn tin nhắn</Text>

                {/* Nếu tin nhắn là văn bản, hiển thị nút "Sao chép nội dung" */}
                {selectedMess?.text && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      Clipboard.setString(selectedMess.text);
                      Alert.alert(
                        'Đã sao chép',
                        'Nội dung tin nhắn đã được sao chép.',
                      );
                      setModal(false);
                    }}>
                    <Text style={styles.modalText}> Sao chép</Text>
                  </TouchableOpacity>
                )}

                {/* Nếu là ảnh, thêm nút "Tải ảnh về" */}
                {selectedMess?.imageUrl && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      downloadImage(selectedMess.imageUrl);
                      setModal(false);
                    }}>
                    <Text style={styles.modalText}> Tải ảnh</Text>
                  </TouchableOpacity>
                )}

                {/* Xóa tin nhắn chỉ ở local */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    deleteMessageLocally(selectedMess.id);
                    setModal(false);
                  }}>
                  <Text style={styles.modalText}> Xóa chỉ mình tôi</Text>
                </TouchableOpacity>

                {/* Thu hồi tin nhắn trên cả hai thiết bị */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    recallMessageForBoth(selectedMess.id);
                    setModal(false);
                  }}>
                  <Text style={styles.modalText}> Thu hồi tin nhắn</Text>
                </TouchableOpacity>

                {/* Nút Đóng */}
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setModal(false)}>
                  <Text style={[styles.modalText, {color: 'red'}]}>Đóng</Text>
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
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          onRequestClose={() => setIsImageModalVisible(false)}>
          <TouchableWithoutFeedback
            onPress={() => setIsImageModalVisible(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'black',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                source={{uri: selectedImage}}
                style={styles.fullScreenImage}
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Hiển thị ảnh mà không bị méo
    backgroundColor: 'black', // Tạo nền đen để nhìn rõ hơn
  },
});

export default Single;

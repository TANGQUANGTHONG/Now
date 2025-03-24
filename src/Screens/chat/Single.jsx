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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
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
const {width, height} = Dimensions.get('window');

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
  const [loadingMessages, setLoadingMessages] = useState({});

  const [isSelfDestruct, setIsSelfDestruct] = useState(false); // Theo dõi trạng thái tin nhắn tự hủy
  const [selfDestructTime, setSelfDestructTime] = useState(null); // Thời gian tin nhắn tự hủy sau khi được gửi
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // Theo dõi trạng thái cuộn tin nhắn tự động khi có tin nhắn mới
  const [isTyping, setIsTyping] = useState(false); // Trạng thái người dùng đang nhập tin nhắn
  const [countChat, setcountChat] = useState(); // Số lượt tin nhắn người dùng còn có thể gửi
  // const [resetCountdown, setResetCountdown] = useState(null);
  const [timers, setTimers] = useState({});
  setSelectedImage;
  const [user, setUser] = useState([]);
  const listRef = useRef(null); // Tham chiếu đến danh sách tin nhắn để thực hiện các hành động như cuộn tự động
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  const [lastActive, setLastActive] = useState(null);

  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [modal, setModal] = useState(false);
  const [selectedMess, setSelectedMess] = useState(null);
  const [unlockedMessages, setUnlockedMessages] = useState({});
  const [timeLefts, setTimeLefts] = useState({});
  const [loadingImageUrl, setLoadingImageUrl] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Quản lý hiển thị menu


  const {RNMediaScanner} = NativeModules;

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dzlomqxnn/upload'; // URL của Cloudinary để upload ảnh
  const CLOUDINARY_PRESET = 'ml_default'; // Preset của Cloudinary cho việc upload ảnh

  const timeOptions = [
    {label: '1 phút', value: 10},
    {label: '2 phút', value: 120},
    {label: '3 phút', value: 180},
    {label: '4 phút', value: 240},
    {label: '5 phút', value: 300},
    {label: 'Tắt tự hủy', value: null},
  ];

  //xóa tin nhắn ở local
  const deleteMessageLocally = async messageId => {
    try {
      // Lấy danh sách tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      // 🔥 Đánh dấu tin nhắn là đã bị xóa thay vì loại bỏ hoàn toàn
      const updatedMessages = oldMessages.map(msg =>
        msg.id === messageId ? {...msg, deleted: true} : msg,
      );

      // 🔥 Lưu lại danh sách tin nhắn đã cập nhật vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(updatedMessages),
      );

      console.log(`🗑 Tin nhắn ${messageId} đã bị đánh dấu là deleted.`);
      setMessages(updatedMessages); // 🔄 Cập nhật UI ngay lập tức
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật trạng thái deleted:', error);
    }
  };

  const deleteMessageForUser = async messageId => {
    try {
      const messageRef = database().ref(
        `/chats/${chatId}/messages/${messageId}`,
      );
      const snapshot = await messageRef.once('value');
      if (snapshot.exists()) {
        const messageData = snapshot.val();
        const newDeletedBy = {...(messageData.deletedBy || {})};
        newDeletedBy[myId] = true;
        await messageRef.update({deletedBy: newDeletedBy});
        console.log(
          `🗑 Tin nhắn ${messageId} đã được đánh dấu xóa bởi ${myId} trên Firebase.`,
        );
      }
    } catch (error) {
      console.error(
        '❌ Lỗi khi cập nhật trạng thái deletedBy trên Firebase:',
        error,
      );
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
    if (message.isPinned) {
      // Nếu tin nhắn đã ghim, mở modal bỏ ghim
      handleUnpinRequest(message);
    } else {
      // Nếu tin nhắn chưa ghim, mở modal ghim
      setSelectedMessage(message);
      // setIsPinModalVisible(true);
      setSelectedMess(message); // Lưu tin nhắn đang chọn
      setModal(true); // Hiển thị Modal
    }
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
        let messages = storedMessages ? JSON.parse(storedMessages) : [];

        // ✅ Lọc bỏ tin nhắn đã bị xóa
        messages = messages.filter(
          msg => !(msg.deletedBy && msg.deletedBy[myId] === true),
        );

        // ✅ Đặt lại `isLocked = true` cho tin nhắn chưa bị xóa
        messages = messages.map(msg => ({
          ...msg,
          isLocked: msg.deletedBy && msg.deletedBy[myId] ? false : true,
        }));

        setMessages(messages);
        console.log('📩 Tin nhắn sau khi mở lại:', messages);
      } catch (error) {
        console.error('❌ Lỗi khi tải tin nhắn từ AsyncStorage:', error);
      }
    };

    loadMessagesFromStorage();
  }, [chatId]);

  LogBox.ignoreAllLogs();
  console.warn = () => {};

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

  const getStatusText = () => {
    if (!lastActive) return 'Đang hoạt động';

    const now = Date.now();

    const diff = now - lastActive;

    if (diff < 10000) return 'Đang hoạt động';

    if (diff < 60000) return 'Vừa mới truy cập';

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
            text: data.text ? decryptMessage(data.text, secretKey) : ' Ảnh mới',
            imageUrl: data.imageUrl || null,
            timestamp: data.timestamp,
            selfDestruct: data.selfDestruct || false,
            selfDestructTime: data.selfDestructTime || null,
            seen: data.seen || {},
            deletedBy: {},
            isLockedBy: data.isLockedBy || {[myId]: true}, // 🔥 Lấy từ Firebase
            TimeLeft: data.TimeLeft || {},
          }))
          .filter(msg => !(msg.deletedBy && msg.deletedBy[myId]) || !msg.id)
          .sort((a, b) => a.timestamp - b.timestamp);

        console.log('📩 Tin nhắn mới từ Firebase:', newMessages);

        // 🛑 Lọc các tin nhắn bị xóa (chỉ sau khi cập nhật AsyncStorage)
        const messagesToDelete = newMessages.filter(
          msg => msg.deletedBy?.[myId],
        );

        // 🔥 Cập nhật `AsyncStorage` với trạng thái `deletedBy`
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        let oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

        let updatedMessages = [...oldMessages, ...newMessages]
          .reduce((unique, msg) => {
            if (!unique.some(m => m.id === msg.id)) unique.push(msg);
            return unique;
          }, [])
          .sort((a, b) => a.timestamp - b.timestamp);

        // 🔥 Ghi đè trạng thái `deletedBy` vào AsyncStorage trước khi xóa
        if (messagesToDelete.length > 0) {
          updatedMessages = updatedMessages.map(msg =>
            messagesToDelete.some(delMsg => delMsg.id === msg.id)
              ? {...msg, deletedBy: {...msg.deletedBy, [myId]: true}}
              : msg,
          );
        }

        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(updatedMessages),
        );

        // 🔄 Cập nhật lại danh sách tin nhắn trong UI (sau khi đồng bộ với Firebase)
        setMessages(updatedMessages.filter(msg => !msg.deletedBy?.[myId]));
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
  }, [chatId, secretKey]);

  // Lắng nghe sự kiện khi người dùng đang nhập tin nhắn
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

  const formatCountdown = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const sendMessage = useCallback(
    async text => {
      // const text = customText || text;
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
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
          return;
        }

        let {countChat = 100} = userSnapshot.val();

        // Tạo timestamp chung từ Firebase để đồng bộ thời gian
        const currentTimestamp = Date.now();

        // Nếu cuộc trò chuyện chưa tồn tại, tạo mới
        if (!chatSnapshot.exists()) {
          await chatRef.set({users: {[userId]: true, [myId]: true}});
        }

        // Mã hóa tin nhắn trước khi gửi
        const encryptedText = encryptMessage(text, secretKey);
        const messageRef = chatRef.child('messages').push(); // Tạo reference cho tin nhắn mới
        const messageId = messageRef.key; // Lấy ID tin nhắn duy nhất từ Firebase
        const messageData = {
          id: messageId, // Đảm bảo ID không bị trùng
          senderId: myId,
          text: encryptedText || '🔒 Tin nhắn mã hóa',
          // TimeLeft: isSelfDestruct
          //   ? {[myId]: selfDestructTime, [userId]: selfDestructTime}
          //   : null,
          deletedBy: {},
          timestamp: currentTimestamp,
          selfDestruct: isSelfDestruct,
          selfDestructTime: isSelfDestruct ? selfDestructTime : null,
          seen: {[userId]: false, [myId]: true},
          isLockedBy: {[userId]: true, [myId]: true}, // 🔒 Chỉ khóa nếu tin nhắn tự hủy
        };

        // Gửi tin nhắn lên Firebase
        await messageRef.set(messageData);

        setText(''); // Xóa nội dung nhập vào sau khi gửi
        await userRef.update({countChat: countChat - 1});
        setcountChat(countChat - 1);
      } catch (error) {
        console.error('❌ Lỗi khi gửi tin nhắn:', error);
      } finally {
        setTimeout(() => setIsSending(false), 1000); // Cho phép gửi lại sau 1 giây
      }
    },
    [text, chatId, secretKey, isSelfDestruct, selfDestructTime, isSending],
  );

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

  // Khi countChat về 0, cập nhật timeReset trên Firebase (lưu thời gian reset dưới dạng timestamp)
  const resetDuration = 24 * 60 * 60; // 86400 giây, tức 24 giờ
  const [resetCountdown, setResetCountdown] = useState(null);

  useEffect(() => {
    const userTimeResetRef = database().ref(`/users/${myId}/timeReset`);
    userTimeResetRef.once('value').then(snapshot => {
      const serverTimeReset = snapshot.val(); // Lấy timestamp từ Firebase
      const currentTime = Date.now();

      if (serverTimeReset) {
        // Tính số giây còn lại dựa trên thời gian hiện tại và timestamp từ Firebase
        const timeLeft = Math.max(
          0,
          Math.floor((serverTimeReset - currentTime) / 1000),
        );
        setResetCountdown(timeLeft);
      } else {
        // Nếu chưa có timeReset trên Firebase, thiết lập mới
        const timeResetValue = currentTime + resetDuration * 1000;
        database().ref(`/users/${myId}`).update({timeReset: timeResetValue});
        setResetCountdown(resetDuration);
      }
    });
  }, [countChat, myId]);

  // Hàm chạy interval để đếm ngược mỗi giây
  useEffect(() => {
    if (resetCountdown > 0) {
      const interval = setInterval(() => {
        setResetCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [resetCountdown]);

  // Cập nhật đồng hồ đếm ngược mỗi giây và reset khi hết thời gian
  useEffect(() => {
    if (resetCountdown !== null) {
      const intervalId = setInterval(() => {
        setResetCountdown(prev => {
          if (prev <= 1) {
            // Khi countdown hết, reset lượt chat và xóa timeReset trên Firebase
            database().ref(`/users/${myId}`).update({countChat: 100});
            database().ref(`/users/${myId}/timeReset`).remove();
            setcountChat(100);
            clearInterval(intervalId);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [resetCountdown, myId]);

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
              setChatList(chatListFromStorage);
              return;
            }

            const chatsData = snapshot.val();
            const chatEntries = Object.entries(chatsData);
            const chatPromises = chatEntries.map(async ([chatId, chat]) => {
              if (!chat.users || !chat.users[currentUserId]) return null;
              const otherUserId = Object.keys(chat.users).find(
                uid => uid !== currentUserId,
              );
              if (!otherUserId) return null;
              const secretKey = generateSecretKey(otherUserId, currentUserId);
              const userRef = database().ref(`users/${otherUserId}`);
              const userSnapshot = await userRef.once('value');
              if (!userSnapshot.exists()) return null;
              const userInfo = userSnapshot.val();
              const decryptedName = safeDecrypt(userInfo?.name);
              const decryptedImage = safeDecrypt(userInfo?.Image);
              let lastMessage = '';
              let lastMessageTime = '';
              let lastMessageTimestamp = 0;
              let unreadCount = 0;
              let lastMessageId = null;
              let isSeen = true;
              const messagesRef = database().ref(`chats/${chatId}/messages`);
              const messagesSnapshot = await messagesRef.once('value');

              if (messagesSnapshot.exists()) {
                const messagesData = messagesSnapshot.val();
                const sortedMessages = Object.entries(messagesData)
                  .map(([msgId, msg]) => ({msgId, ...msg}))
                  .sort((a, b) => b.timestamp - a.timestamp);
                if (sortedMessages.length > 0) {
                  const latestMessage = sortedMessages[0];
                  lastMessageId = latestMessage.msgId;
                  lastMessage =
                    decryptMessage(latestMessage.text, secretKey) ||
                    'Tin nhắn bị mã hóa';

                  lastMessageTime = new Date(
                    latestMessage.timestamp,
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  lastMessageTimestamp = latestMessage.timestamp;
                  isSeen = latestMessage?.seen?.[currentUserId] || false;

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
            });

            const resolvedChats = await Promise.all(chatPromises);

            let filteredChats = resolvedChats
              .filter(Boolean)
              .sort((a, b) => b.timestamp - a.timestamp);

            if (filteredChats.length === 0) {
              console.log('🔥 Firebase mất dữ liệu, giữ lại danh sách cũ.');
              filteredChats = chatListFromStorage;
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
      setLoadingImageUrl(imageUri);

      const tempMessageId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        senderId: myId,
        imageUrl: imageUri,
        timestamp: Date.now(),
        isLoading: true,
      };
      setMessages(prev => [...prev, tempMessage]);

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

        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessageId
              ? {...msg, imageUrl: data.secure_url, isLoading: false}
              : msg,
          ),
        );

        sendImageMessage(data.secure_url, tempMessageId);
      } else {
        throw new Error('Lỗi khi tải ảnh lên Cloudinary');
      }
    } catch (error) {
      console.error('❌ Lỗi khi upload ảnh:', error);
    } finally {
      setLoadingImageUrl(null);
    }
  };

  // Hàm gửi tin nhắn ảnh
  const sendImageMessage = async imageUrl => {
    if (!imageUrl || isSending) return;
    setIsSending(true);

    try {
      const chatRef = database().ref(`/chats/${chatId}/messages`).push();
      const timestamp = Date.now();

      const messageData = {
        senderId: myId,
        imageUrl: imageUrl,
        timestamp: timestamp,
        seen: {[myId]: true, [userId]: false},
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        isLockedBy: isSelfDestruct ? {[myId]: true} : undefined,
        TimeLeft: undefined, // 🚀 Không đặt TimeLeft ngay lập tức
      };

      await chatRef.set(messageData);
      console.log('✅ Ảnh đã gửi vào Firebase:', imageUrl);
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

      await chatRef.set(messageData);

      setIsSending(false);
    } catch (error) {
      console.error('❌ Lỗi khi gửi ảnh:', error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
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

  const handleUnlockMessage = async (messageId, selfDestructTime) => {
    setUnlockedMessages(prev => ({...prev, [messageId]: true}));
    try {
      // Cập nhật Firebase, không cập nhật UI ngay
      await database()
        .ref(`/chats/${chatId}/messages/${messageId}/isLockedBy`)
        .update({[myId]: false});

      console.log(
        `✅ Đã gửi yêu cầu mở khóa tin nhắn ${messageId} lên Firebase`,
      );
      // 🔥 Cập nhật `AsyncStorage` ngay sau khi cập nhật Firebase
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      messages = messages.map(msg =>
        msg.id === messageId
          ? {...msg, isLockedBy: {...msg.isLockedBy, [myId]: false}}
          : msg,
      );

      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(messages),
      );
      const messageRef = database().ref(
        `/chats/${chatId}/messages/${messageId}/TimeLeft/${myId}`,
      );
      const snapshot = await messageRef.once('value');
      const existingExpiry = snapshot.val();

      // Nếu đã có TimeLeft, giữ nguyên, nếu chưa có thì tạo mới
      const expiryTimestamp = existingExpiry
        ? existingExpiry
        : Date.now() + selfDestructTime * 1000;

      // console.log(`📌 Lưu TimeLeft: ${messageId} | ${myId} | ${expiryTimestamp}`);
      // await database()
      // .ref(`/chats/${chatId}/messages/${messageId}/isLockedBy`)
      // .update({
      //   [myId]: false,
      // });

      //  Cập nhật Firebase
      await database()
        .ref(`/chats/${chatId}/messages/${messageId}/TimeLeft`)
        .update({
          [myId]: expiryTimestamp,
        });

      //  Lưu vào AsyncStorage
      await AsyncStorage.setItem(
        `expiry_${messageId}_${myId}`,
        expiryTimestamp.toString(),
      );
      setMessages(messages); // 🔄 Cập nhật UI ngay lập tức
      // 🔥 Cập nhật UI với countdown mới
      setTimeLefts(prev => ({
        ...prev,
        [messageId]: Math.floor((expiryTimestamp - Date.now()) / 1000),
      }));
    } catch (error) {
      console.error('❌ Lỗi khi mở khóa tin nhắn:', error);
    }

    // // ✅ Đặt hẹn giờ tự động khóa lại tin nhắn
    // setTimeout(async () => {
    //   setMessages(prev =>
    //     prev.map(msg =>
    //       msg.id === messageId
    //         ? {...msg, isLockedBy: {...msg.isLockedBy, [myId]: true}}
    //         : msg,
    //     ),
    //   );

    //   await database()
    //     .ref(`/chats/${chatId}/messages/${messageId}/isLockedBy`)
    //     .update({
    //       [myId]: true,
    //     });
    // }, selfDestructTime * 1000);
    // checkExpiredMessages()
  };

  const checkExpiredMessages = async () => {
    const currentTime = Date.now();
    let updatedTimeLefts = {}; // ✅ Lưu thời gian còn lại

    for (const msg of messages) {
      if (!msg.isLocked && (!msg.deletedBy || !msg.deletedBy[myId])) {
        const expiryTimestamp =
          msg.TimeLeft?.[myId] ||
          (await AsyncStorage.getItem(`expiry_${msg.id}_${myId}`));

        if (expiryTimestamp) {
          const timeLeft = Math.max(
            0,
            Math.floor((Number(expiryTimestamp) - currentTime) / 1000),
          );

          if (timeLeft > 0) {
            updatedTimeLefts[msg.id] = timeLeft; // ✅ Cập nhật thời gian còn lại
          } else {
            console.log(`🔥 Tin nhắn ${msg.id} đã hết thời gian, cập nhật xóa`);

            // 🔥 Cập nhật Firebase
            await database()
              .ref(`/chats/${chatId}/messages/${msg.id}/deletedBy`)
              .update({
                [myId]: true,
              });

            // 🔄 Cập nhật AsyncStorage
            const storedMessages = await AsyncStorage.getItem(
              `messages_${chatId}`,
            );
            let oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
            const updatedMessages = oldMessages.filter(
              m => !(m.deletedBy && m.deletedBy[myId]),
            );
            await AsyncStorage.setItem(
              `messages_${chatId}`,
              JSON.stringify(updatedMessages),
            );

            setMessages(updatedMessages);
          }
        }
      }
    }

    setTimeLefts(updatedTimeLefts); // ✅ Cập nhật UI với countdown
  };

  useEffect(() => {
    const checkLocalStorage = async () => {
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      console.log(
        '📩 Tin nhắn trong AsyncStorage:',
        JSON.parse(storedMessages),
      );

      const chatList = await AsyncStorage.getItem('chatList');
      console.log(
        '💬 Danh sách chat trong AsyncStorage:',
        JSON.parse(chatList),
      );
    };

    checkLocalStorage();
  }, []);

  // Gọi khi app mở lại
  // useEffect(() => {
  //   checkExpiredMessages();
  // }, []);

  // ✅ Chạy countdown khi mở khóa
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentTime = Date.now();
      let updatedTimeLefts = {};
      let messagesToDelete = [];

      setTimeLefts(prevTimeLefts => {
        let newTimeLefts = {...prevTimeLefts};

        // 🔄 Giảm thời gian đếm ngược
        Object.keys(newTimeLefts).forEach(msgId => {
          if (newTimeLefts[msgId] > 0) {
            newTimeLefts[msgId] -= 1;
          } else {
            messagesToDelete.push(msgId);
          }
        });

        return newTimeLefts;
      });

      // 🔄 Kiểm tra tin nhắn đã mở khóa và còn thời gian tự hủy
      for (const msg of messages) {
        if (msg.isLockedBy?.[myId] === false) {
          let expiryTimestamp = msg.TimeLeft?.[myId];

          if (!expiryTimestamp) {
            const localExpiry = await AsyncStorage.getItem(
              `expiry_${msg.id}_${myId}`,
            );
            expiryTimestamp = localExpiry ? Number(localExpiry) : null;
          }

          if (expiryTimestamp) {
            let timeLeft = Math.max(
              0,
              Math.floor((expiryTimestamp - currentTime) / 1000),
            );
            console.log(`⏳ Tin nhắn ${msg.id} còn lại: ${timeLeft}s`);

            if (timeLeft > 0) {
              updatedTimeLefts[msg.id] = timeLeft;
            } else {
              messagesToDelete.push(msg.id);
            }
          }
        }
      }

      // 🔥 Cập nhật countdown UI
      setTimeLefts(prev => ({
        ...prev,
        ...updatedTimeLefts,
      }));

      // 🔥 Gửi yêu cầu cập nhật `deletedBy[myId]` lên Firebase
      if (messagesToDelete.length > 0) {
        const updates = {};
        messagesToDelete.forEach(msgId => {
          updates[
            `/chats/${chatId}/messages/${msgId}/deletedBy/${myId}`
          ] = true;
        });

        // 🔥 Gửi yêu cầu xóa lên Firebase
        await database().ref().update(updates);
        console.log(
          '🛑 Đã gửi yêu cầu xóa tin nhắn lên Firebase:',
          messagesToDelete,
        );

        // 🔥 Cập nhật ngay vào AsyncStorage để đồng bộ UI
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        let messages = storedMessages ? JSON.parse(storedMessages) : [];

        messages = messages.map(msg =>
          messagesToDelete.includes(msg.id)
            ? {...msg, deletedBy: {...msg.deletedBy, [myId]: true}}
            : msg,
        );

        await AsyncStorage.setItem(
          `messages_${chatId}`,
          JSON.stringify(messages),
        );
        console.log('💾 Đã lưu trạng thái deletedBy vào AsyncStorage');

        // 🔄 Cập nhật UI ngay lập tức
        setMessages(messages.filter(msg => !msg.deletedBy?.[myId]));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLefts, messages, chatId]); // ✅ Thêm `timeLefts` để không bị dừng lại
  //gửi vị trí
  useEffect(() => {
    if (route.params?.locationMessage) {
      sendLocationMessage(route.params.locationMessage);
    }
  }, [route.params?.locationMessage]);

  const sendLocationMessage = async message => {
    setText(''); // Clear input vì bạn gửi tự động
    await sendMessage(message);
  };
  // console.log(timeLefts);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // 🔥 Khi rời trang, tự động khóa lại tin nhắn tự hủy
        lockSelfDestructMessages();
      };
    }, []),
  );

  const lockSelfDestructMessages = async () => {
    try {
      console.log('🔒 Đang khóa lại tin nhắn tự hủy...');

      // Lấy danh sách tin nhắn từ Firebase
      const messagesRef = database().ref(`/chats/${chatId}/messages`);
      const snapshot = await messagesRef.once('value');
      if (!snapshot.exists()) return;

      const messages = snapshot.val();
      const updates = {};

      Object.entries(messages).forEach(([messageId, data]) => {
        if (data.selfDestruct) {
          updates[
            `/chats/${chatId}/messages/${messageId}/isLockedBy/${myId}`
          ] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await database().ref().update(updates);
        console.log('✅ Tất cả tin nhắn tự hủy đã bị khóa lại');
      }

      // 🔥 Cập nhật lại AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let localMessages = storedMessages ? JSON.parse(storedMessages) : [];

      localMessages = localMessages.map(msg =>
        msg.selfDestruct
          ? {...msg, isLockedBy: {...msg.isLockedBy, [myId]: true}}
          : msg,
      );

      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(localMessages),
      );
      setMessages(localMessages);
    } catch (error) {
      console.error('❌ Lỗi khi khóa lại tin nhắn tự hủy:', error);
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
          data={messages
            .filter(msg => !(msg.deletedBy?.[myId] === true))
            .sort((a, b) => b.timestamp - a.timestamp)}
          onScrollBeginDrag={() => setShouldAutoScroll(false)}
          onEndReached={() => setShouldAutoScroll(true)}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const isSentByMe = item.senderId === myId;
            const isSelfDestruct = item.selfDestruct;

            const isGoogleMapsLink = text => {
              return /^https:\/\/www\.google\.com\/maps\?q=/.test(text);
            };

            const handlePressLocation = text => {
              const query = text.split('q=')[1];
              const [lat, lng] = query.split(',').map(Number);

              navigation.navigate('MapScreen', {
                externalLocation: {latitude: lat, longitude: lng},
              });
            };

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
                      if (isSelfDestruct && item.isLockedBy?.[myId]) {
                        handleUnlockMessage(item.id, item.selfDestructTime);
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

                    {isSelfDestruct && item.isLockedBy?.[myId] ? (
                      <Text style={styles.lockedMessage}>
                        🔒 Nhấn để mở khóa
                      </Text>
                    ) : (
                      <>
                        {/* Nếu tin nhắn là ảnh */}
                        {item.imageUrl ? (
                          // ảnh
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedImage(item.imageUrl);
                              setIsImageModalVisible(true);
                            }}>
                            <View style={styles.imageWrapper}>
                              <Image
                                source={{uri: item.imageUrl}}
                                style={styles.imageMessage}
                              />
                            </View>
                          </TouchableOpacity>
                        ) : isGoogleMapsLink(item.text) ? (
                          // nếu là link vị trí Google onPress={() => handlePressLocation(item.text)}
                          <View style={{alignItems: 'center'}}>
                            {/* Mini Map */}
                            <MapView
                              style={{
                                width: 200,
                                height: 120,
                                borderRadius: 10,
                              }}
                              initialRegion={{
                                latitude: parseFloat(
                                  item.text.split('q=')[1].split(',')[0],
                                ),
                                longitude: parseFloat(
                                  item.text.split('q=')[1].split(',')[1],
                                ),
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              pointerEvents="none" // chặn tương tác map mini
                            >
                              <Marker
                                coordinate={{
                                  latitude: parseFloat(
                                    item.text.split('q=')[1].split(',')[0],
                                  ),
                                  longitude: parseFloat(
                                    item.text.split('q=')[1].split(',')[1],
                                  ),
                                }}
                              />
                            </MapView>

                            {/* Nút mở Google Maps */}
                            <TouchableOpacity
                              style={{
                                marginTop: 5,
                                backgroundColor: '#2196F3',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                              }}
                              onPress={() => handlePressLocation(item.text)}>
                              <Text style={{color: '#fff'}}>
                                Mở Google Maps
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          // text bình thường
                          <Text
                            style={
                              isSentByMe
                                ? styles.SendmessageText
                                : styles.ReceivedmessageText
                            }>
                            {item.text}
                          </Text>
                        )}
                      </>
                    )}

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
          inverted
          contentContainerStyle={{flexGrow: 1, justifyContent: 'flex-end'}}
        />

        <FlatList
          data={user}
          keyExtractor={item => item.id} // Đảm bảo ID là string
          renderItem={({item}) => <Text>{item.text}</Text>}
        />

        {isTyping && <Text style={styles.typingText}>Đang nhập...</Text>}
        <View style={styles.inputContainer}>
          
{/*chon anh */}
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <Ionicons name="image" size={24} color="#007bff" />
          </TouchableOpacity>

        {/* Bọc icon trong một container riêng */}
        <View style={styles.iconWrapper}>
        <TouchableOpacity onPress={() => setIsMenuVisible(!isMenuVisible)} style={styles.mainButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Menu hiển thị tách biệt */}
      {isMenuVisible && (
        <View style={styles.menuContainer}>
          {/* Gửi vị trí */}
          <TouchableOpacity
            onPress={() => {
              setIsMenuVisible(false); // Ẩn menu trước khi chuyển màn hình
              navigation.navigate('MapScreen', {
                userId,
                myId,
                username,
                img,
                messages,
                isGui: true,
              });
            }}
            style={styles.menuItem}>
            <Ionicons name="navigate-outline" size={24} color="#007bff" />
            <Text style={styles.menuText}>Gửi vị trí</Text>
          </TouchableOpacity>

          {/* Tự động xóa */}
          <TouchableOpacity
            onPress={() => {
              setIsMenuVisible(false); // Ẩn menu trước khi mở modal
              setIsModalVisible(true);
            }}
            style={styles.menuItem}>
            <Icon name={isSelfDestruct ? 'timer-sand' : 'timer-off'} size={24} color={isSelfDestruct ? 'red' : '#007bff'} />
            <Text style={styles.menuText}>{selfDestructTime ? `${selfDestructTime}s` : 'Tự động xóa'}</Text>
          </TouchableOpacity>
        </View>
      )}


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
                <Text style={styles.modalTitle}>Bỏ ghim tin nhắn?</Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    unpinMessage(selectedMessage.id);
                    setIsPinModalVisible(false);
                  }}>
                  <Text style={styles.modalText}>Bỏ ghim</Text>
                </TouchableOpacity>
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

                {/* // Nếu tin nhắn chưa ghim, hiển thị nút ghim */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    pinMessage(selectedMessage.id);
                    setIsPinModalVisible(false);
                    setModal(false);
                  }}>
                  <Text style={styles.modalText}>Ghim</Text>
                </TouchableOpacity>

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
                    deleteMessageForUser(selectedMess.id);
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
              placeholderTextColor={'#aaa'}
              onBlur={() => handleTyping(false)}
            />
          </View>

          <TouchableOpacity
            onPress={() => sendMessage(text)}
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
  imageWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
  },

  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -15}, {translateY: -15}],
  },

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
    color: '#000000',
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
    color: 'black',
  },
  modalOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalText: {
    color: 'black',
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
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  }, mainButton: {
    padding: 10,
  },
  menuContainer: {
    position: 'absolute',
    top: height - 1100,
    right:width - 155,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100, // Giúp hiển thị menu trên UI
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color:'black'
  },
});

export default Single;
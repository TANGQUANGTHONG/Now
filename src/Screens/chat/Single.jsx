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
import styles from '../../Styles/Chat/SingleS';
import ChatLimitModal from '../../components/items/ChatLimitModal';
import Video from 'react-native-video';
import AudioRecorderPlayer from 'react-native-audio-recorder-player'; // Thêm import
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
  const [loadingVideoUrl, setLoadingVideoUrl] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Quản lý hiển thị menu
  const [showNotification, setShowNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState(null); // Theo dõi tin nhắn nào đang phát
  const [isRecording, setIsRecording] = useState(false); // Trạng thái đang ghi âm
  const [audioPath, setAudioPath] = useState(''); // Đường dẫn tệp âm thanh
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [audioStates, setAudioStates] = useState({}); // Lưu trạng thái âm thanh cho từng tin nhắn

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

  


  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Quyền truy cập microphone',
            message: 'Ứng dụng cần quyền để ghi âm tin nhắn thoại.',
            buttonPositive: 'Cho phép',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('❌ Lỗi khi xin quyền:', err);
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert('Lỗi', 'Bạn cần cấp quyền microphone để ghi âm.');
      return;
    }

    if (isRecording) {
      console.log('🎙 Đã ghi âm rồi, bỏ qua...');
      return;
    }

    const path = `${RNFS.DocumentDirectoryPath}/voice_${Date.now()}.mp4`;
    try {
      await audioRecorderPlayer.startRecorder(path);
      setIsRecording(true);
      setAudioPath(path);
      console.log('🎙 Bắt đầu ghi âm:', path);
    } catch (error) {
      console.error('❌ Lỗi khi bắt đầu ghi âm:', error);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!isRecording) {
      console.log('🎙 Chưa ghi âm, không thể dừng.');
      return;
    }

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      console.log('🎙 Đã dừng ghi âm:', result);
      if (audioPath) {
        await uploadAudioToCloudinary(audioPath);
      } else {
        console.error('❌ Không có đường dẫn âm thanh để tải lên');
      }
    } catch (error) {
      console.error('❌ Lỗi khi dừng ghi âm:', error);
    }
  };

  const uploadAudioToCloudinary = async (audioUri) => {
    if (!audioUri || isSending) {
      console.log('❌ Không có audioUri hoặc đang gửi');
      return;
    }

    setIsSending(true);

    try {
      const fileExists = await RNFS.exists(audioUri);
      if (!fileExists) {
        throw new Error('Tệp âm thanh không tồn tại');
      }

      const tempMessageId = `temp-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        { id: tempMessageId, senderId: myId, audioUrl: audioUri, timestamp: Date.now(), isLoading: true },
      ]);

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? `file://${audioUri}` : audioUri,
        type: 'audio/mp4',
        name: `voice_${Date.now()}.mp4`,
      });
      formData.append('upload_preset', CLOUDINARY_PRESET);

      console.log('📤 Đang tải lên Cloudinary:', audioUri);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error(`Lỗi Cloudinary: ${data.error?.message || 'Không rõ nguyên nhân'}`);
      }

      console.log('✅ Tải lên thành công:', data.secure_url);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessageId ? { ...msg, audioUrl: data.secure_url, isLoading: false } : msg
        )
      );
      await sendAudioMessage(data.secure_url, tempMessageId);
    } catch (error) {
      console.error('❌ Lỗi khi tải âm thanh:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn thoại.');
    } finally {
      setIsSending(false);
    }
  };

  // Hàm gửi tin nhắn âm thanh lên Firebase
  const sendAudioMessage = async (audioUrl, tempMessageId) => {
    if (!audioUrl || isSending) return;

    try {
      const chatRef = database().ref(`/chats/${chatId}/messages`).push();
      const timestamp = Date.now();

      const messageData = {
        senderId: myId,
        audioUrl: audioUrl,
        text: encryptMessage('🎙 Tin nhắn thoại', secretKey),
        timestamp: timestamp,
        seen: { [myId]: true, [userId]: false },
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        isLockedBy: isSelfDestruct ? { [myId]: true, [userId]: true } : {},
      };

      await chatRef.set(messageData);
      console.log('✅ Tin nhắn thoại đã gửi:', audioUrl);

      const userRef = database().ref(`/users/${myId}`);
      const snapshot = await userRef.once('value');
      let { countChat: currentCount = 100 } = snapshot.val();
      if (currentCount === 0) {
        setShowNotification(true);
        return;
      }
      await userRef.update({ countChat: currentCount - 1 });
      setcountChat(currentCount - 1);
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn thoại:', error);
      Alert.alert('Lỗi', 'Không thể lưu tin nhắn thoại vào Firebase.');
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      await audioRecorderPlayer.startPlayer(audioUrl);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          audioRecorderPlayer.stopPlayer();
        }
      });
    } catch (error) {
      console.error('❌ Lỗi khi phát âm thanh:', error);
    }
  };

  const toggleAudio = async (messageId, audioUrl) => {
    const currentState = audioStates[messageId] || { isPlaying: false, duration: 0, currentTime: 0 };
  
    try {
      if (currentState.isPlaying) {
        await audioRecorderPlayer.pausePlayer();
        setAudioStates(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], isPlaying: false },
        }));
        setPlayingAudioId(null);
        console.log('⏸ Tạm dừng âm thanh:', audioUrl);
      } else {
        if (playingAudioId && playingAudioId !== messageId) {
          await audioRecorderPlayer.stopPlayer();
          setAudioStates(prev => ({
            ...prev,
            [playingAudioId]: { ...prev[playingAudioId], isPlaying: false, currentTime: 0 },
          }));
        }
  
        await audioRecorderPlayer.startPlayer(audioUrl);
        setPlayingAudioId(messageId);
  
        audioRecorderPlayer.addPlayBackListener((e) => {
          const duration = e.duration / 1000;
          const currentTime = e.currentPosition / 1000;
  
          setAudioStates(prev => ({
            ...prev,
            [messageId]: {
              isPlaying: true,
              duration: duration || prev[messageId]?.duration || 0,
              currentTime,
            },
          }));
  
          if (currentTime >= duration) {
            audioRecorderPlayer.stopPlayer();
            setAudioStates(prev => ({
              ...prev,
              [messageId]: { ...prev[messageId], isPlaying: false, currentTime: 0 },
            }));
            setPlayingAudioId(null);
            console.log('🏁 Âm thanh kết thúc:', audioUrl);
          }
        });
  
        console.log('▶️ Phát âm thanh:', audioUrl);
      }
    } catch (error) {
      console.error('❌ Lỗi khi xử lý âm thanh:', error);
      setPlayingAudioId(null);
      setAudioStates(prev => ({
        ...prev,
        [messageId]: { ...prev[messageId], isPlaying: false },
      }));
    }
  };
  
  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const getAudioDuration = async (audioUrl, messageId) => {
    try {
      await audioRecorderPlayer.startPlayer(audioUrl);
      audioRecorderPlayer.addPlayBackListener((e) => {
        const duration = e.duration / 1000; // Chuyển từ ms sang giây
        setAudioStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            duration: duration || prev[messageId]?.duration || 0,
            isPlaying: false,
            currentTime: 0,
          },
        }));
        audioRecorderPlayer.stopPlayer(); // Dừng ngay lập tức sau khi lấy duration
      });
      console.log(`⏱ Lấy duration cho ${messageId}: ${audioUrl}`);
    } catch (error) {
      console.error('❌ Lỗi khi lấy duration:', error);
      return 0;
    }
  };

  //xóa tin nhắn ở local
  const deleteMessageLocally = async messageId => {
    try {
      // Lấy danh sách tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

// Đánh dấu tin nhắn là đã bị xóa bởi myId trong deletedBy
const updatedMessages = oldMessages.map(msg =>
  msg.id === messageId
    ? {...msg, deletedBy: {...(msg.deletedBy || {}), [myId]: true}}
    : msg,
);
      // 🔥 Lưu lại danh sách tin nhắn đã cập nhật vào AsyncStorage
      await AsyncStorage.setItem(
        `messages_${chatId}`,
        JSON.stringify(updatedMessages),
      );

// Cập nhật UI ngay lập tức, lọc bỏ tin nhắn đã bị xóa bởi myId
setMessages(updatedMessages.filter(msg => !msg.deletedBy?.[myId]));
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
        // 🔥 Kiểm tra trạng thái deletedBy từ Firebase
        const chatRef = database().ref(`/chats/${chatId}`);
        const chatSnapshot = await chatRef.once('value');
        if (chatSnapshot.exists() && chatSnapshot.val().deletedBy?.[myId]) {
          console.log(`🚫 Chat ${chatId} đã bị xóa, không tải tin nhắn từ local`);
          setMessages([]);
          return;
        }

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
  const userRef = database().ref(`/users/${userId}`);

  const onUserStatusChange = (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      setIsOnline(userData.isOnline || false); // Lấy trạng thái isOnline
      setLastActive(userData.lastActive || null); // Vẫn giữ lastActive để hiển thị thời gian offline
    }
  };

  userRef.on('value', onUserStatusChange);

  return () => userRef.off('value', onUserStatusChange);
}, [userId]);

// Hàm hiển thị trạng thái
const getStatusText = () => {
  if (isOnline) {
    return 'Đang hoạt động';
  } else if (lastActive) {
    const now = Date.now();
    const diff = now - lastActive;

    if (diff < 60000) return 'Vừa mới truy cập';
    if (diff < 3600000) return `Hoạt động ${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `Hoạt động ${Math.floor(diff / 3600000)} giờ trước`;
    return `Hoạt động ${Math.floor(diff / 86400000)} ngày trước`;
  }
  return '';
};


  // lấy dữ liệu từ firebase về để show lên
  useEffect(() => {
    const typingRef = database().ref(`/chats/${chatId}/typing`);
    const messagesRef = database().ref(`/chats/${chatId}/messages`);
    const chatRef = database().ref(`/chats/${chatId}`);

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
const chatSnapshot = await chatRef.once('value');
  // const isChatDeletedByMe = chatSnapshot.exists() && chatSnapshot.val().deletedBy?.[myId];

// 🔥 Nếu chat không tồn tại trên Firebase (bị xóa hoàn toàn)
if (!chatSnapshot.exists()) {
  console.log(`🚫 Chat ${chatId} không tồn tại trên Firebase, xóa dữ liệu local`);
  
  // Xóa messages_${chatId} trong AsyncStorage
  await AsyncStorage.removeItem(`messages_${chatId}`);
  
  // Xóa chatId khỏi chatList trong AsyncStorage
  const storedChats = await AsyncStorage.getItem('chatList');
  let chatList = storedChats ? JSON.parse(storedChats) : [];
  chatList = chatList.filter(chat => chat.chatId !== chatId);
  await AsyncStorage.setItem('chatList', JSON.stringify(chatList));
  
  // Đặt messages về rỗng trong UI
  setMessages([]);
  return;
}
// Logic hiện tại cho chat còn tồn tại
const isChatDeletedByMe = chatSnapshot.val().deletedBy?.[myId];

if (!snapshot.exists()) return;

      try {
        const firebaseMessages = snapshot.val();
        if (!firebaseMessages) return;

        const newMessages = Object.entries(firebaseMessages)
          .map(([id, data]) => ({
            id,
            senderId: data.senderId,
            text: data.text ? decryptMessage(data.text, secretKey) : null, // Chỉ xử lý text nếu có
            audioUrl: data.audioUrl || null, 
            imageUrl: data.imageUrl || null,
            videoUrl: data.videoUrl || null,
            timestamp: data.timestamp,
            selfDestruct: data.selfDestruct || false,
            selfDestructTime: data.selfDestructTime || null,
            seen: data.seen || {},
            deletedBy: data.deletedBy || {}, // Giữ trạng thái deletedBy từ Firebase
            isLockedBy: data.isLockedBy || {[myId]: true}, // 🔥 Lấy từ Firebase
            TimeLeft: data.TimeLeft || {},
          }))
          .filter(msg => !(msg.deletedBy && msg.deletedBy[myId]) || !msg.id)
          .sort((a, b) => a.timestamp - b.timestamp);

          // Lấy duration cho các tin nhắn có audioUrl
      for (const msg of newMessages) {
        if (msg.audioUrl && !audioStates[msg.id]?.duration) {
          await getAudioDuration(msg.audioUrl, msg.id);
        }
      }

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

  // Lắng nghe sự thay đổi của countChat trên Firebase
  useEffect(() => {
    const userRef = database().ref(`/users/${myId}/countChat`);

    const onCountChatChange = snapshot => {
      if (snapshot.exists()) {
        const newCountChat = snapshot.val();
        setcountChat(newCountChat);

        // Hiển thị thông báo khi hết lượt chat
        if (newCountChat === 0) {
          setShowNotification(true);
        }
      }
    };

    // Lắng nghe thay đổi của countChat
    userRef.on('value', onCountChatChange);

    // Cleanup để ngừng lắng nghe khi component unmount
    return () => userRef.off('value', onCountChatChange);
  }, [myId]);

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

        const chatDeletedRef = database().ref(
          `/chats/${chatId}/deletedBy/${myId}`,
        );
        await chatDeletedRef.remove();

     // Cập nhật UI
    setMessages(prev => [
      ...prev.filter(msg => msg.id !== messageId), // Loại bỏ trùng lặp
      {
        id: messageId,
        senderId: myId,
        text: text,
        timestamp: currentTimestamp,
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        seen: {[userId]: false, [myId]: true},
        isLockedBy: {[userId]: true, [myId]: true},
        deletedBy: {},
      },
    ].sort((a, b) => a.timestamp - b.timestamp));

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

  const pickMedia = () => {
    const options = {
      mediaType: 'mixed',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Lỗi', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedMedia = response.assets[0];
        uploadMediaToCloudinary(selectedMedia.uri, selectedMedia.type);
      }
    });
  };

  const uploadMediaToCloudinary = async (mediaUri, mediaType) => {
    try {
      const isImage = mediaType.startsWith('image');
      const fileType = isImage ? 'image' : 'video';
      console.log('📤 Media type:', mediaType, 'File type:', fileType); // Log loại media
      isImage ? setLoadingImageUrl(mediaUri) : setLoadingVideoUrl(mediaUri);

      const tempMessageId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        senderId: myId,
        [`${fileType}Url`]: mediaUri,
        timestamp: Date.now(),
        isLoading: true,
      };
      setMessages(prev => [...prev, tempMessage]);

      const formData = new FormData();
      formData.append('file', {
        uri: mediaUri,
        type: mediaType,
        name: `upload_${Date.now()}.${mediaType.split('/')[1]}`,
      });
      formData.append('upload_preset', CLOUDINARY_PRESET);

      console.log(`📤 Đang tải ${fileType} lên Cloudinary...`);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log(`✅ Phản hồi từ Cloudinary:`, data);

      if (!data.secure_url) {
        throw new Error(
          `Lỗi Cloudinary: ${data.error?.message || 'Không rõ nguyên nhân'}`,
        );
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessageId
            ? {...msg, [`${fileType}Url`]: data.secure_url, isLoading: false}
            : msg,
        ),
      );

      sendMediaMessage(data.secure_url, tempMessageId, fileType);
    } catch (error) {
      console.error(`❌ Lỗi khi upload ${mediaType}:`, error);
    } finally {
      isImage ? setLoadingImageUrl(null) : setLoadingVideoUrl(null);
    }
  };

  const sendMediaMessage = async (mediaUrl, tempMessageId, fileType) => {
    if (!mediaUrl || isSending) return;
    setIsSending(true);
  
    try {
      const chatRef = database().ref(`/chats/${chatId}/messages`).push();
      const timestamp = Date.now();
  
      const messageData = {
        senderId: myId,
        [`${fileType}Url`]: mediaUrl,
        text: fileType === 'video' ? encryptMessage(' Video mới', secretKey) : null, // Thêm text cho video
        timestamp: timestamp,
        seen: {[myId]: true, [userId]: false},
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        isLockedBy: isSelfDestruct ? {[myId]: true} : undefined,
      };
  
      await chatRef.set(messageData);
      console.log(`✅ ${fileType} đã gửi vào Firebase:`, mediaUrl);
  
      // Cập nhật số lượt chat còn lại
      const userRef = database().ref(`/users/${myId}`);
      const snapshot = await userRef.once('value');
      let {countChat = 100} = snapshot.val();
      if (countChat === 0) {
        setShowNotification(true);
        return;
      }
      await userRef.update({countChat: countChat - 1});
      setcountChat(countChat - 1);
  
      setIsSending(false);
    } catch (error) {
      console.error(`❌ Lỗi khi gửi ${fileType}:`, error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  //   // Hàm gửi tin nhắn video lên Firebase
  //   const sendVideoMessage = async videoUrl => {
  //     if (!videoUrl || isSending) return;
  //     setIsSending(true);

  //     try {
  //       const chatRef = database().ref(`/chats/${chatId}/messages`).push();
  //       const timestamp = Date.now();

  //       const messageData = {
  //         id: tempMessageId,
  //         senderId: myId,
  //         imageUrl: videoUrl,
  //         timestamp: Date.now(),
  //         isLoading: true,
  //       };

  //       await chatRef.set(messageData);
  //       console.log('✅ Video đã gửi vào Firebase:', videoUrl);

  //       // Cập nhật số lượt tin nhắn còn lại
  //       const userRef = database().ref(`/users/${myId}`);
  //       const snapshot = await userRef.once('value');
  //       let {countChat = 100} = snapshot.val();
  //       if (countChat === 0) {
  //         setShowNotification(true);
  //         return;
  //       }
  //       await userRef.update({countChat: countChat - 1});
  //       setcountChat(countChat - 1);

  //       const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
  //       const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

  //       await chatRef.set(messageData);

  //       setIsSending(false);
  //     } catch (error) {
  //       console.error('❌ Lỗi khi gửi video:', error);
  //     } finally {
  //       setTimeout(() => setIsSending(false), 1000);
  //     }
  //   };
  // // Hàm gửi tin nhắn ảnh
  // const sendImageMessage = async imageUrl => {
  //   if (!imageUrl || isSending) return;
  //   setIsSending(true);

  //   try {
  //     const chatRef = database().ref(`/chats/${chatId}/messages`).push();
  //     const timestamp = Date.now();

  //     const messageData = {
  //       senderId: myId,
  //       imageUrl: imageUrl,
  //       timestamp: timestamp,
  //       seen: {[myId]: true, [userId]: false},
  //       selfDestruct: isSelfDestruct,
  //       selfDestructTime: isSelfDestruct ? selfDestructTime : null,
  //       isLockedBy: isSelfDestruct ? {[myId]: true} : undefined,
  //       TimeLeft: undefined, // 🚀 Không đặt TimeLeft ngay lập tức
  //     };

  //     await chatRef.set(messageData);
  //     console.log('✅ Ảnh đã gửi vào Firebase:', imageUrl);
  //     // Cập nhật số lượt tin nhắn còn lại sau khi gửi ảnh
  //     const userRef = database().ref(`/users/${myId}`);
  //     const snapshot = await userRef.once('value');
  //     let {countChat = 100} = snapshot.val();
  //     if (countChat === 0) {
  //       setShowNotification(true);
  //       return;
  //     }
  //     await userRef.update({countChat: countChat - 1});
  //     setcountChat(countChat - 1);

  //     const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
  //     const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

  //     await chatRef.set(messageData);

  //     setIsSending(false);
  //   } catch (error) {
  //     console.error('❌ Lỗi khi gửi ảnh:', error);
  //   } finally {
  //     setTimeout(() => setIsSending(false), 1000);
  //   }
  // };

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
  useEffect(() => {
    checkExpiredMessages();
  }, []);

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
        <ChatLimitModal
          visible={showNotification}
          onClose={() => setShowNotification(false)}
          timeReset={formatCountdown(resetCountdown)}
        />
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
            // console.log('📋 Dữ liệu tin nhắn:', item);
            const isPlaying = playingAudioId === item.id; // Kiểm tra tin nhắn này có đang phát không
            const isSentByMe = item.senderId === myId;
            const isSelfDestruct = item.selfDestruct;
            // console.log('Video URL:', item.videoUrl);

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
              <View style={{ flexDirection: 'column' }}>
                <View style={isSentByMe ? styles.sentWrapper : styles.receivedWrapper}>
                  {!isSentByMe && <Image source={{ uri: img }} style={styles.avatar} />}
                  <TouchableOpacity
                    onPress={() => {
                      if (item.audioUrl) {
                        if (!isSelfDestruct || !item.isLockedBy?.[myId]) {
                          toggleAudio(item.id, item.audioUrl);
                        } else {
                          handleUnlockMessage(item.id, item.selfDestructTime);
                        }
                      } else if (isSelfDestruct && item.isLockedBy?.[myId]) {
                        handleUnlockMessage(item.id, item.selfDestructTime);
                      }
                    }}
                    onLongPress={() => handleLongPress(item)}
                    style={[
                      isSentByMe ? styles.sentContainer : styles.receivedContainer,
                      isSelfDestruct && styles.selfDestructMessage,
                    ]}>
                    {!isSentByMe && <Text style={styles.usernameText}>{username}</Text>}
                    {isSelfDestruct && item.isLockedBy?.[myId] ? (
                      <Text style={styles.lockedMessage}>🔒 Nhấn để mở khóa</Text>
                    ) : (
                      <>
                        {/* Nếu tin nhắn là âm thanh */}
                        {item.audioUrl ? (
  <View style={styles.audioWrapper}>
    {item.isLoading ? (
      <ActivityIndicator size="large" color="blue" style={styles.loadingIndicator} />
    ) : (
      <>
        <TouchableOpacity
          onPress={() => toggleAudio(item.id, item.audioUrl)}
          style={styles.playButton}>
          <Ionicons
            name={audioStates[item.id]?.isPlaying ? "pause-circle" : "play-circle"}
            size={40}
            color="#007bff"
          />
        </TouchableOpacity>
        <Text style={styles.audioTimer}>
          {Math.floor(audioStates[item.id]?.currentTime || 0)}s /{' '}
          {Math.floor(audioStates[item.id]?.duration || 0)}s
        </Text>
      </>
    )}
    {isSelfDestruct && timeLefts[item.id] > 0 && (
      <Text style={styles.selfDestructTimer}>🕒 {timeLefts[item.id]}s</Text>
    )}
  </View>
) : item.videoUrl ? (
                          <View style={styles.videoWrapper}>
                            {item.isLoading ? (
                              <ActivityIndicator size="large" color="blue" style={styles.loadingIndicator} />
                            ) : (
                              <Video
                                source={{ uri: item.videoUrl }}
                                style={{ width: 300, height: 200, backgroundColor: 'black' }}
                                controls
                                resizeMode="cover"
                                onError={e => console.log('🔥 Video error:', e)}
                                onLoad={() => console.log('✅ Video loaded:', item.videoUrl)}
                              />
                            )}
                            {isSelfDestruct && timeLefts[item.id] > 0 && (
                              <Text style={styles.selfDestructTimer}>🕒 {timeLefts[item.id]}s</Text>
                            )}
                          </View>
                        ) : item.imageUrl ? (
                          <TouchableOpacity
                            onPress={() => {
                              if (isSelfDestruct && item.isLockedBy?.[myId]) {
                                handleUnlockAndStartTimer(item.id, item.imageUrl, item.selfDestructTime);
                              } else {
                                setSelectedImage(item.imageUrl);
                                setIsImageModalVisible(true);
                              }
                            }}>
                            <View style={styles.imageWrapper}>
                              {item.isLoading || !item.imageUrl ? (
                                <ActivityIndicator size="large" color="blue" style={styles.loadingIndicator} />
                              ) : (
                                <Image source={{ uri: item.imageUrl }} style={styles.imageMessage} />
                              )}
                            </View>
                            {isSelfDestruct && timeLefts[item.id] > 0 && (
                              <Text style={styles.selfDestructTimer}>🕒 {timeLefts[item.id]}s</Text>
                            )}
                          </TouchableOpacity>
                        ) : isGoogleMapsLink(item.text) ? (
                          <View style={{ alignItems: 'center' }}>
                            <MapView
                              style={{ width: 200, height: 120, borderRadius: 10 }}
                              initialRegion={{
                                latitude: parseFloat(item.text.split('q=')[1].split(',')[0]),
                                longitude: parseFloat(item.text.split('q=')[1].split(',')[1]),
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              pointerEvents="none">
                              <Marker
                                coordinate={{
                                  latitude: parseFloat(item.text.split('q=')[1].split(',')[0]),
                                  longitude: parseFloat(item.text.split('q=')[1].split(',')[1]),
                                }}
                              />
                            </MapView>
                            <TouchableOpacity
                              style={{
                                marginTop: 5,
                                backgroundColor: '#2196F3',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                              }}
                              onPress={() => handlePressLocation(item.text)}>
                              <Text style={{ color: '#fff' }}>Mở Google Maps</Text>
                            </TouchableOpacity>
                            {isSelfDestruct && timeLefts[item.id] > 0 && (
                              <Text style={styles.selfDestructTimer}>🕒 {timeLefts[item.id]}s</Text>
                            )}
                          </View>
                        ) : item.text ? (
                          <>
                            <Text
                              style={
                                isSentByMe ? styles.SendmessageText : styles.ReceivedmessageText
                              }>
                              {item.text}
                            </Text>
                            {isSelfDestruct && timeLefts[item.id] > 0 && (
                              <Text style={styles.selfDestructTimer}>🕒 {timeLefts[item.id]}s</Text>
                            )}
                          </>
                        ) : null}
                        {/* Chỉ hiển thị timestamp nếu không phải tin nhắn tự động xóa */}
                        {!isSelfDestruct && (
                          <Text
                            style={
                              isSentByMe ? styles.Sendtimestamp : styles.Revecivedtimestamp
                            }>
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );/////
          }}
          inverted
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        />

        <FlatList
          data={user}
          keyExtractor={item => item.id} // Đảm bảo ID là string
          renderItem={({item}) => <Text>{item.text}</Text>}
        />

        {isTyping && <Text style={styles.typingText}>Đang nhập...</Text>}
        <View style={styles.inputContainer}>
          {/*chon anh */}
          <TouchableOpacity onPress={pickMedia} style={styles.imageButton}>
            <Ionicons name="image" size={24} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecordingAndSend}
            style={[styles.audioButton, isRecording && styles.recordingButton]}>
            <Ionicons
              name={isRecording ? "mic" : "mic-outline"}
              size={24}
              color={isRecording ? "red" : "#007bff"}
            />
          </TouchableOpacity>

          {/* Bọc icon trong một container riêng */}
          <View style={styles.iconWrapper}>
            <TouchableOpacity
              onPress={() => setIsMenuVisible(!isMenuVisible)}
              style={styles.mainButton}>
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
                <Icon
                  name={isSelfDestruct ? 'timer-sand' : 'timer-off'}
                  size={24}
                  color={isSelfDestruct ? 'red' : '#007bff'}
                />
                <Text style={styles.menuText}>
                  {selfDestructTime ? `${selfDestructTime}s` : 'Tự động xóa'}
                </Text>
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

export default Single;
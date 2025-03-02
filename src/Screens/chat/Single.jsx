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
import database, {set, onValue, ref } from '@react-native-firebase/database';
import ActionSheet from 'react-native-actionsheet';
import {
  getAllChatsAsyncStorage,
  getAllUsersFromUserSend,
  getChatsByIdUserAsynStorage,
} from '../../storage/Storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';


globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const Single = () => {
  const route = useRoute();
  const {
    userId,
    myId,
    username,
    img,
    messages: cachedMessages,
  } = route.params || {};
  const [messages, setMessages] = useState(cachedMessages || []);
  const [text, setText] = useState('');
  const navigation = useNavigation();
  const chatId = encodeChatId(userId, myId);
  const secretKey = generateSecretKey(userId, myId); // Tạo secretKey cho phòng chat
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [selfDestructTime, setSelfDestructTime] = useState(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [countChat, setcountChat] = useState();
  const [resetCountdown, setResetCountdown] = useState(null);
  const [timers, setTimers] = useState({});
  const [user, setUser] = useState([]);
  const [Seen, setSeen] = useState(false);
  const listRef = useRef(null);
  const isFirstRender = useRef(true); // Đánh dấu lần đầu render
  const actionSheetRef = useRef();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messagene, setMessageNe] = useState([])
  
  const timeOptions = [
    {label: '5 giây', value: 5},
    {label: '10 giây', value: 10},
    {label: '1 phút', value: 60},
    {label: '5 phút', value: 300},
    {label: 'Tắt tự hủy', value: null},
  ];

  // LogBox.ignoreLogs(['Animated: `useNativeDriver` was not specified']);
  LogBox.ignoreAllLogs(); // 🔥 Ẩn tất cả cảnh báo
console.warn = () => {}; 
  // console.log("secretKey",secretKey)
// console.log("userID",userId)
  // 🔹 Lấy tin nhắn realtime
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

    const onMessageChange = async (snapshot) => {
      if (!snapshot.exists()) return;
    
      try {
        const firebaseMessages = snapshot.val();
        if (!firebaseMessages) return;
    
        const newMessages = Object.entries(firebaseMessages)
          .map(([id, data]) => {
            if (!data.senderId || !data.text || !data.timestamp) return null;
            return {
              id,
              senderId: data.senderId,
              text: decryptMessage(data.text, secretKey) || "❌ Lỗi giải mã",
              timestamp: data.timestamp,
              selfDestruct: data.selfDestruct || false,
              selfDestructTime: data.selfDestructTime || null,
              seen: data.seen || {},
            };
          })
          .filter((msg) => msg !== null);
    
        console.log("📩 Tin nhắn mới từ Firebase:", newMessages);
    
        // ✅ Chỉ lấy tin nhắn không tự hủy
        const nonSelfDestructMessages = newMessages.filter(msg => !msg.selfDestruct);
    
        // 📥 Lấy tin nhắn cũ từ AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
    
        // 🔥 Gộp tin nhắn mới với tin nhắn cũ, loại bỏ trùng lặp
        const updatedMessages = [...oldMessages, ...nonSelfDestructMessages].reduce(
          (acc, msg) => {
            if (!acc.find((m) => m.id === msg.id)) acc.push(msg);
            return acc;
          },
          []
        );
    
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    
        // console.log("💾 Tin nhắn đã lưu vào AsyncStorage:", updatedMessages);
    
        // ✅ Cập nhật danh sách chatId trong local
        const storedChatList = await AsyncStorage.getItem("chatList");
        let chatList = storedChatList ? JSON.parse(storedChatList) : [];
    
        if (!chatList.includes(chatId)) {
          chatList.push(chatId);
          await AsyncStorage.setItem("chatList", JSON.stringify(chatList));
          console.log("💾 ChatId đã lưu vào AsyncStorage:", chatList);
        }
    
        // ✅ Cập nhật state để UI hiển thị đúng
        setMessages(updatedMessages);
    
        if (isFirstRender.current && listRef.current) {
          setTimeout(() => listRef.current.scrollToEnd({ animated: true }), 500);
          isFirstRender.current = false;
        }
    
        // ✅ Đánh dấu tin nhắn đã seen (tức là đã lưu vào local)
        for (const msg of nonSelfDestructMessages) {
          const seenRef = database().ref(`/chats/${chatId}/messages/${msg.id}/seen`);
          await seenRef.child(myId).set(true); // Đánh dấu tin nhắn đã seen bởi người dùng hiện tại
    
          // 🛑 Kiểm tra nếu cả hai người đã seen
          seenRef.once("value", (snapshot) => {
            if (snapshot.exists()) {
              const seenUsers = snapshot.val();
              const totalUsers = Object.keys(seenUsers).length;
    
              if (totalUsers >= 2) {
                // console.log(`⏳ Tin nhắn ${msg.id} đã được cả hai seen, sẽ xóa sau 10 giây`);
    
                // 🏃‍♂️ Sau 10 giây, xóa tin nhắn
                setTimeout(async () => {
                  console.log(`🗑 Xóa tin nhắn ${msg.id} khỏi Firebase`);
                  await database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
                }, 10000);
              }
            }
          });
        }
      } catch (error) {
        console.error("❌ Lỗi khi xử lý tin nhắn:", error.message || error);
      }
    };
    
    
    
    
    
    
    

    
    

    const updateCountdown = async () => {
      try {
        const timestampRef = database().ref('/timestamp');
        await timestampRef.set(database.ServerValue.TIMESTAMP);
        const snapshot = await timestampRef.once('value');

        if (!snapshot.exists()) {
          throw new Error('Không thể lấy timestamp từ Firebase');
        }

        const currentTimestamp = snapshot.val();

        const messagesSnapshot = await database()
          .ref(`/chats/${chatId}/messages`)
          .orderByChild('timestamp')
          .limitToLast(1)
          .once('value');

        let lastMessageTimestamp = currentTimestamp;
        if (messagesSnapshot.exists()) {
          const lastMessage = Object.values(messagesSnapshot.val())[0];
          lastMessageTimestamp = lastMessage.timestamp || currentTimestamp;
        }

        const now = new Date(currentTimestamp);
        const nextResetTime = new Date(lastMessageTimestamp);
        nextResetTime.setHours(24, 0, 0, 0);

        const timeLeft = Math.max(0, Math.floor((nextResetTime - now) / 1000));
        setResetCountdown(timeLeft);

        await database().ref(`/users/${myId}/resetCountdown`).set(timeLeft);
      } catch (error) {
        console.error(
          '❌ Lỗi cập nhật thời gian reset:',
          error.message || error,
        );
      }
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);
    if (!cachedMessages || cachedMessages.length === 0) {
      const loadMessages = async () => {
        try {
          const storedMessages = await AsyncStorage.getItem(
            `messages_${chatId}`,
          );
          if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
          }
        } catch (error) {
          console.error('❌ Lỗi tải tin nhắn từ AsyncStorage:', error);
        }
      };
      loadMessages();
    }


  messagesRef.on('value', onMessageChange);
  typingRef.on('value', onTypingChange);

    return () => {
      clearInterval(interval);
      messagesRef.off('value', onMessageChange);
      typingRef.off('value', onTypingChange);
    };
  }, [chatId, secretKey, shouldAutoScroll]);

  useEffect(() => {
    if (messagene.length === 0) return; // Nếu không có tin nhắn mới, không làm gì cả
  
    const updateSavedStatus = async () => {
      for (const msg of messagene) {
        const savedRef = database().ref(`/chats/${chatId}/messages/${msg.id}/saved`);
        await savedRef.child(myId).set(true);
  
        // 🛑 Kiểm tra nếu tất cả người tham gia đã lưu
        const snapshot = await savedRef.once('value');
        if (snapshot.exists()) {
          const savedUsers = snapshot.val();
          const totalUsers = Object.keys(savedUsers).length;
  
          if (totalUsers >= 2) {
            console.log(`🗑 Xóa tin nhắn ${msg.id} vì tất cả đã lưu`);
            setTimeout(async () => {
              console.log(`🗑 Xóa tin nhắn ${msg.id} sau 10 giây`);
              await database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
            }, 10000);
          }
        }
      }
    };
  
    updateSavedStatus();
  }, [messagene]); // 🔥 Chạy lại mỗi khi `messagene` thay đổi

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers = {};
        messages.forEach(msg => {
          if (msg.selfDestruct) {
            // Tính thời gian còn lại
            const timeLeft = Math.max(
              0,
              Math.floor(
                (msg.timestamp + msg.selfDestructTime * 1000 - Date.now()) /
                  1000,
              ),
            );
            newTimers[msg.id] = timeLeft;

            // Xóa tin nhắn khi hết giờ
            if (timeLeft === 0) {
              deleteMessageLocallyAndRemotely(msg.id);
            }
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

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
  }, [myId, database]); // ✅ Thêm dependency
  

  const deleteMessageLocallyAndRemotely = async (messageId) => {
    try {
      // Xóa tin nhắn trong Firebase
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();
  
      // Lấy tin nhắn từ AsyncStorage
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
  
      // Lọc bỏ tin nhắn cần xóa
      const updatedMessages = oldMessages.filter(msg => msg.id !== messageId);
  
      // Cập nhật lại AsyncStorage
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
  
      console.log(`🗑 Tin nhắn ${messageId} đã bị xóa khỏi Firebase và AsyncStorage.`);
      setMessages(updatedMessages); // Cập nhật UI
    } catch (error) {
      console.error("❌ Lỗi khi xóa tin nhắn:", error);
    }
  };
  

  const formatCountdown = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const sendMessage = useCallback(async () => {
    if (!text.trim()) return;
    setShouldAutoScroll(true);
  
    try {
      const userRef = database().ref(`/users/${myId}`);
      const chatRef = database().ref(`/chats/${chatId}`);
  
      const [userSnapshot, chatSnapshot] = await Promise.all([
        userRef.once('value'),
        chatRef.once('value'),
      ]);
  
      if (!userSnapshot.exists()) {
        return Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      }
  
      let { countChat = 100 } = userSnapshot.val();
  
      const timestampRef = database().ref('/timestamp');
      await timestampRef.set(database.ServerValue.TIMESTAMP);
      const currentTimestamp = (await timestampRef.once('value')).val();
  
      if (!chatSnapshot.exists()) {
        await chatRef.set({ users: { [userId]: true, [myId]: true } });
      }
  
      const messageRef = chatRef.child('messages').push();
      const encryptedText = encryptMessage(text, secretKey);
  
      const messageData = {
        senderId: myId,
        text: encryptedText || "🔒 Tin nhắn mã hóa",
        timestamp: currentTimestamp,
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        seen: { [userId]: false, [myId]: true },
      };
  
      await messageRef.set(messageData);
  
      await userRef.update({ countChat: countChat - 1 });
      setcountChat(countChat - 1);
      setText('');
  
      // Nếu tin nhắn **KHÔNG tự hủy**, lưu vào AsyncStorage
      if (!isSelfDestruct) {
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
        const updatedMessages = [...oldMessages, { id: messageRef.key, ...messageData }];
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
      }
  
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
    }
  }, [text, chatId, secretKey, isSelfDestruct, selfDestructTime]);

  
  
// xóa cả 2
  // const deleteMessageForBoth = async (messageId) => {
  //   try {
  //     const messageRef = database().ref(`/chats/${chatId}/messages/${messageId}`);
  
  //     // Kiểm tra xem tin nhắn có tồn tại không
  //     const snapshot = await messageRef.once('value');
  //     if (!snapshot.exists()) return;
  
  //     // Cập nhật trạng thái `deleted: true` thay vì xóa ngay lập tức
  //     await messageRef.update({ deleted: true });
  
  //     console.log(`✅ Đã đánh dấu tin nhắn ${messageId} là đã xóa.`);
  //   } catch (error) {
  //     console.error('❌ Lỗi khi xóa tin nhắn:', error);
  //   }
  // };
  

  // 🔹 Xác nhận xóa tin nhắn
  const confirmDeleteMessage = messageId => {
    Alert.alert('Xóa tin nhắn', 'Bạn có chắc muốn xóa tin nhắn này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', onPress: () => deleteMessageForBoth(messageId) },
    ]);
  };
  

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

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getChatsByIdUserAsynStorage();
      // console.log('Dữ  AsyncStorage:', data);
      setUser(data.messages);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chatList');
        let chatListFromStorage = storedChats ? JSON.parse(storedChats) : [];
  
        const currentUserId = auth().currentUser?.uid;
        if (!currentUserId) return;
  
        const chatRef = database().ref('chats');

  
        database().ref('chats').on('value', async (snapshot) => {
          if (!snapshot.exists()) {
            console.log('🔥 Firebase không có dữ liệu, hiển thị từ AsyncStorage.');
            setChatList(chatListFromStorage); // ✅ Nếu Firebase mất dữ liệu, giữ dữ liệu cũ
            return;
          }
  
          const chatsData = snapshot.val();
          const chatEntries = Object.entries(chatsData);
  
          const chatPromises = chatEntries.map(async ([chatId, chat]) => {
            if (!chat.users || !chat.users[currentUserId]) return null;
  
            const otherUserId = Object.keys(chat.users).find(uid => uid !== currentUserId);
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
                .map(([msgId, msg]) => ({ msgId, ...msg }))
                .sort((a, b) => b.timestamp - a.timestamp);
  
              if (sortedMessages.length > 0) {
                const latestMessage = sortedMessages[0];
                lastMessageId = latestMessage.msgId;
                lastMessage = decryptMessage(latestMessage.text, secretKey) || 'Tin nhắn bị mã hóa';
                lastMessageTime = new Date(latestMessage.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                lastMessageTimestamp = latestMessage.timestamp;
                isSeen = latestMessage?.seen?.[currentUserId] || false;
  
                unreadCount = isSeen ? 0 : sortedMessages.filter(
                  msg => msg.senderId !== currentUserId && !msg.seen?.[currentUserId]
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
          let filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
  
          if (filteredChats.length === 0) {
            console.log('🔥 Firebase mất dữ liệu, giữ lại danh sách cũ.');
            filteredChats = chatListFromStorage; // ✅ Dùng dữ liệu cũ nếu Firebase mất dữ liệu
          }
  
          await AsyncStorage.setItem('chatList', JSON.stringify(filteredChats));
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate(oStackHome.TabHome.name)}
            style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#000" />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Image source={{uri: img}} style={styles.headerAvatar} />
            <Text style={styles.headerUsername}>{username}</Text>
          </View>

          <View style={styles.chatStatus}>
            {countChat > 0 ? (
              <Text style={styles.chatCountText}>
                {countChat} lượt nhắn tin
              </Text>
            ) : (
              <Text style={styles.resetText}>
                Hết lượt - Reset sau {formatCountdown(resetCountdown)}
              </Text>
            )}
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const messageId = item.id;
            const isSentByMe = item.senderId === myId;
            const isSelfDestruct = item.selfDestruct;
            const timestamp = item.timestamp;
            const selfDestructTime = item.selfDestructTime;

            const expirationTime = timestamp + selfDestructTime * 1000;
            const timeLeft = isSelfDestruct
              ? Math.max(
                  0,
                  Math.floor((expirationTime - (Date.now() + 3000)) / 1000),
                )
              : null;

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
                    onLongPress={() => confirmDeleteMessage(item.id)}
                    style={[
                      isSentByMe
                        ? styles.sentContainer
                        : styles.receivedContainer,
                      isSelfDestruct && styles.selfDestructMessage,
                    ]}>
                    {!isSentByMe && (
                      <Text style={styles.usernameText}>{username}</Text>
                    )}

                    <Text
                      style={
                        isSentByMe
                          ? styles.SendmessageText
                          : styles.ReceivedmessageText
                      }>
                      {item.text}
                    </Text>

                    {/* Hiển thị thời gian đếm ngược */}
                    {isSelfDestruct &&
                      selfDestructTime !== null &&
                      timeLeft > 0 && (
                        <Text style={styles.selfDestructTimer}>
                          🕒 {timeLeft}s
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

                {/* Đặt "Đã xem" ở dưới sentWrapper và receivedWrapper */}
                {isSentByMe && (
                  <View style={styles.seenStatusContainer}>
                    <Text style={{color: item.seen[userId] ? 'white' : 'gray'}}>
                      {item.seen[userId] ? 'Đã xem' : 'Đã gửi'}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
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

          {/* Modal chọn thời gian */}
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

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={value => {
                setText(value); // Cập nhật tin nhắn
                handleTyping(value.length > 0); // Cập nhật trạng thái nhập
              }}
              placeholder="Nhập tin nhắn..."
              onBlur={() => handleTyping(false)} // Khi mất focus thì dừng nhập
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim()}
            style={styles.sendButton}>
            <Icon
              name="send"
              size={24}
              color={text.trim() ? '#007bff' : '#aaa'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
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

  selfDestructMessage: {
    backgroundColor: '#ffcccb', // Màu đỏ nhạt để hiển thị tin nhắn tự hủy
  },
  selfDestructTimer: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'right',
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
});

export default Single;

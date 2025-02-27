import React, {useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {getFirestore} from '@react-native-firebase/firestore';
import {
  encryptMessage,
  decryptMessage,
  generateSecretKey,
  encodeChatId,
} from '../../cryption/Encryption';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {oStackHome} from '../../navigations/HomeNavigation';
import database, {set} from '@react-native-firebase/database';
import ActionSheet from 'react-native-actionsheet';
import {
  getAllChatsAsyncStorage,
  getAllUsersFromUserSend,
  getChatsByIdUserAsynStorage,
} from '../../storage/Storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const Single = () => {
  const route = useRoute();
  const {userId, myId, username, img, messages: cachedMessages} = route.params || {};
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
  const actionSheetRef = useRef();

  const options = ['5 giây', '10 giây', '1 phút', '5 phút', 'Hủy'];

  LogBox.ignoreLogs(['Animated: `useNativeDriver` was not specified']);


  
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
  
    typingRef.on('value', onTypingChange);
  
    // Lắng nghe tin nhắn từ Firebase
    const onMessageChange = async snapshot => {
      if (!snapshot.exists()) {
        console.log('📭 Không có tin nhắn mới từ Firebase.');
        return;
      }
    
      try {
        const firebaseMessages = snapshot.val();
        if (!firebaseMessages) return;
    
        const newMessages = Object.entries(firebaseMessages)
          .map(([id, data]) => {
            if (!data || typeof data !== 'object') return null;
            if (!data.senderId || !data.text || !data.timestamp) return null;
    
            const decryptedText = decryptMessage(data.text, secretKey) || '❌ Lỗi giải mã';
    
            return {
              id,
              senderId: data.senderId,
              text: decryptedText,
              timestamp: data.timestamp,
              selfDestruct: data.selfDestruct || false,
              selfDestructTime: data.selfDestructTime || null,
              seen: data.seen || {},
              saved: data.saved || {}, // ✅ Thêm trạng thái saved từ Firebase
            };
          })
          .filter(msg => msg !== null);
    
        console.log('📩 Tin nhắn mới từ Firebase:', newMessages);
    
        // 📥 Lấy tin nhắn cũ từ AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];
    
        // 🔥 Gộp tin nhắn mới với tin nhắn cũ, loại bỏ trùng lặp
        const updatedMessages = [...oldMessages, ...newMessages].reduce((acc, msg) => {
          if (!acc.find(m => m.id === msg.id)) acc.push(msg);
          return acc;
        }, []);
    
        // 💾 Lưu lại vào AsyncStorage
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
        setMessages(updatedMessages);
    
        // ✅ Cập nhật trạng thái `saved` trong Firebase
        newMessages.forEach(msg => {
          database()
            .ref(`/chats/${chatId}/messages/${msg.id}/saved/${myId}`)
            .set(true);
        });
    
      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn:', error.message || error);
      }
    };
    
    
    
    
  
    messagesRef.on('value', onMessageChange);
  
    return () => {
      messagesRef.off('value', onMessageChange);
      typingRef.off('value', onTypingChange);
    };
  }, [chatId, secretKey, shouldAutoScroll]);
  

  const checkAndDeleteMessages = async () => {
    try {
      const messagesRef = database().ref(`/chats/${chatId}/messages`);
      const snapshot = await messagesRef.once('value');
  
      if (!snapshot.exists()) return;
  
      const messages = snapshot.val();
      const updates = {}; // Lưu danh sách tin nhắn cần xóa
  
      Object.entries(messages).forEach(([messageId, messageData]) => {
        const savedByUser1 = messageData.saved?.[myId] || false;
        const savedByUser2 = messageData.saved?.[userId] || false;
  
        if (savedByUser1 && savedByUser2) {
          updates[`/chats/${chatId}/messages/${messageId}`] = null; // Xóa tin nhắn
        }
      });
  
      if (Object.keys(updates).length > 0) {
        await database().ref().update(updates);
        console.log(`✅ Đã xóa ${Object.keys(updates).length} tin nhắn.`);
      } else {
        console.log("⏳ Chưa có tin nhắn nào đủ điều kiện để xóa.");
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra và xóa tin nhắn:', error);
    }
  };
  


  

  useEffect(() => {
    checkAndDeleteMessages(); // Kiểm tra và xóa tin nhắn nếu đủ điều kiện
  }, [messages]);
  

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
              database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
            }
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  useEffect(() => {
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
        console.error('❌ Lỗi cập nhật thời gian reset:', error.message || error);
      }
    };
  
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
  
    return () => clearInterval(interval);
  }, [chatId]);
  

  useEffect(() => {
    if (!cachedMessages || cachedMessages.length === 0) {
      const loadMessages = async () => {
        try {
          const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
          if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
          }
        } catch (error) {
          console.error('❌ Lỗi tải tin nhắn từ AsyncStorage:', error);
        }
      };
      loadMessages();
    }
  }, [chatId]);
  
  
  

  useEffect(() => {
    const userRef = database().ref(`/users/${myId}/countChat`);

    userRef.once('value').then(snapshot => {
      if (snapshot.exists()) {
        setcountChat(snapshot.val()); // Cập nhật số lượt nhắn tin từ Firebase
      }
    });

    return () => userRef.off(); // Cleanup
  }, [myId]);

  const formatCountdown = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const sendMessage = async () => {
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
  
      let { lastResetTimestamp = 0, countChat = 100 } = userSnapshot.val();
  
      const timestampRef = database().ref('/timestamp');
      await timestampRef.set(database.ServerValue.TIMESTAMP);
      const currentTimestamp = (await timestampRef.once('value')).val();
  
      if (!chatSnapshot.exists()) {
        await chatRef.set({ users: { [userId]: true, [myId]: true } });
      }
  
      // ✅ Gửi tin nhắn với timestamp chính xác
      const messageRef = chatRef.child('messages').push();
      const encryptedText = encryptMessage(text, secretKey);
  
      await messageRef.set({
        senderId: myId,
        text: encryptedText || "🔒 Tin nhắn mã hóa",
        timestamp: database.ServerValue.TIMESTAMP, // Dùng timestamp dạng số
        selfDestruct: isSelfDestruct,
        selfDestructTime: isSelfDestruct ? selfDestructTime : null,
        seen: {
          [userId]: false,
          [myId]: true,
        },
      });
  
      await userRef.update({ countChat: countChat - 1 });
      setcountChat(countChat - 1);
      setText('');
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
    }
  };
  

  // 🔹 Xóa tin nhắn cả hai
  const deleteMessageForBoth = async messageId => {
    try {
      const messageRef = database().ref(`/chats/${chatId}/messages/${messageId}`);
      const snapshot = await messageRef.once('value');
  
      if (!snapshot.exists()) return;
  
      const messageData = snapshot.val();
      const savedByUser1 = messageData.saved?.[myId] || false;
      const savedByUser2 = messageData.saved?.[userId] || false;
  
      if (savedByUser1 && savedByUser2) {
        // ✅ Chỉ xóa nếu cả 2 đã lưu
        await messageRef.remove();
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        console.log(`✅ Đã xóa tin nhắn ${messageId} vì cả hai user đã lưu.`);
      } else {
        console.log(`⏳ Chưa xóa tin nhắn ${messageId} vì chưa đủ cả hai user lưu.`);
      }
    } catch (error) {
      console.error('❌ Lỗi khi xóa tin nhắn:', error);
    }
  };
  
  // 🔹 Xác nhận xóa tin nhắn
  const confirmDeleteMessage = messageId => {
    Alert.alert('Xóa tin nhắn', 'Bạn muốn xóa tin nhắn này?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Xóa', onPress: () => deleteMessageForBoth(messageId)},
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

  const handleSelectTime = index => {
    const timeOptions = [5, 10, 60, 300, null]; // Các tùy chọn thời gian
    const selectedTime = timeOptions[index];

    if (selectedTime === null) {
      setIsSelfDestruct(false);
      setSelfDestructTime(null);
    } else {
      setSelfDestructTime(selectedTime);
      setIsSelfDestruct(true);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getChatsByIdUserAsynStorage();
      // console.log('Dữ  AsyncStorage:', data);
      setUser(data.messages);
    };

    fetchUsers();
  }, []);

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
  renderItem={({ item }) => {
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

      <View style={{ flexDirection: 'column' }}>
  <View style={isSentByMe ? styles.sentWrapper : styles.receivedWrapper}>
    {!isSentByMe && <Image source={{ uri: img }} style={styles.avatar} />}
    <TouchableOpacity
      onLongPress={() => confirmDeleteMessage(item.id)}
      style={[
        isSentByMe ? styles.sentContainer : styles.receivedContainer,
        isSelfDestruct && styles.selfDestructMessage,
      ]}
    >
      {!isSentByMe && <Text style={styles.usernameText}>{username}</Text>}

      <Text
        style={isSentByMe ? styles.SendmessageText : styles.ReceivedmessageText}
      >
        {item.text}
      </Text>

      {/* Hiển thị thời gian đếm ngược */}
      {isSelfDestruct && selfDestructTime !== null && timeLeft > 0 && (
        <Text style={styles.selfDestructTimer}>🕒 {timeLeft}s</Text>
      )}

      {/* Hiển thị thời gian gửi tin nhắn */}
      <Text
        style={isSentByMe ? styles.Sendtimestamp : styles.Revecivedtimestamp}
      >
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
      <Text style={{ color: item.seen[userId] ? 'white' : 'gray' }}>
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
            onPress={() => actionSheetRef.current.show()}
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
          <ActionSheet
            ref={actionSheetRef}
            title={'Chọn thời gian tự hủy'}
            options={options}
            cancelButtonIndex={4}
            onPress={handleSelectTime}
          />
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
    marginTop:10,
  
  },
  receivedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginTop:10
  },
  avatar: {width: 40, height: 40, borderRadius: 20, marginRight: 8, marginLeft:10},
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
    width:"100%"
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
    alignSelf: "flex-end", // Để căn phải theo tin nhắn
    marginTop: 2, // Tạo khoảng cách với tin nhắn
    marginRight: 10, // Đẩy sát mép tin nhắn
  },
});

export default Single;

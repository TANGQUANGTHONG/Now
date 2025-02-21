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
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {getFirestore} from '@react-native-firebase/firestore';
import {
  encryptMessage,
  decryptMessage,
  generateSecretKey,
} from '../../cryption/Encryption';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {oStackHome} from '../../navigations/HomeNavigation';
import database from '@react-native-firebase/database';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const Single = () => {
  const route = useRoute();
  const {userId, myId, username, img} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const navigation = useNavigation();
  const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;
  const secretKey = generateSecretKey(userId, myId); // Tạo secretKey cho phòng chat
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(0)
  const [countdown, setCountdown] = useState(0);

  const listRef = useRef(null);
  const timerRef = useRef(null);  

  // 🔹 Lấy tin nhắn realtime
  useEffect(() => {
    const typingRef = database().ref(`/chats/${chatId}/typing`);

    const userRef = database().ref(`/users/${myId}`);
  
    const onUserDataChange = userRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const maxCount = userData.count || 5;
        const countChat = userData.countChat || 0;
        const remaining = maxCount - countChat;
        setRemainingMessages(remaining);
        if( remaining === 0){
          setCountdown(10);
           // Nếu có bộ đếm trước đó, clear trước khi tạo mới
        if (timerRef.current) clearInterval(timerRef.current);
        let timeLeft = 10;
        timerRef.current = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);

          if (timeLeft <= 0) {
            clearInterval(timerRef.current);
            setRemainingMessages(maxCount); // Reset lại số tin nhắn có thể gửi
            userRef.update({ countChat: 0 }); // Reset trên Firebase
          }
        }, 1000);
        }
      }
    });

    typingRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();
        setIsTyping(typingData.isTyping && typingData.userId !== myId);
      } else {
        setIsTyping(false);
      }
    });

    if (shouldAutoScroll && listRef.current) {
      setTimeout(() => {
        listRef.current.scrollToEnd({animated: true});
        setShouldAutoScroll(false); // Tắt auto-scroll sau khi load
      }, 500);
    }
    const messagesRef = database().ref(`/chats/${chatId}/messages`);

    const onMessageChange = messagesRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const msgs = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          senderId: data.senderId,
          text: decryptMessage(data.text, secretKey),
          timestamp: new Date(data.timestamp),
          selfDestruct: data.selfDestruct || false, // Kiểm tra tin nhắn tự hủy
        }));

        setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));

        // Xóa các tin nhắn tự hủy sau 5 giây nếu có
        msgs.forEach(msg => {
          if (msg.selfDestruct) {
            setTimeout(() => {
              database().ref(`/chats/${chatId}/messages/${msg.id}`).remove();
            }, 5000);
          }
        });
      }
    });
    

    return () => {
      messagesRef.off('value', onMessageChange);
      typingRef.off(); // Cleanup khi rời khỏi màn hình
      userRef.off('value', onUserDataChange);
    };
  }, [chatId, secretKey, shouldAutoScroll,myId]);


  useEffect(() => {
    let timer;
    if (remainingMessages === 0) {
      setCountdown(10); // Bắt đầu đếm ngược từ 10 giây
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(timer);
            setRemainingMessages(5); // Reset lượt nhắn tin sau khi đếm ngược xong
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [remainingMessages]);



  // 🔹 Gửi tin nhắn
  const sendMessage = async () => {
    if (!text.trim() || remainingMessages === 0) return;

    setShouldAutoScroll(true); // Kích hoạt auto-scroll

    try {
      const userRef = database().ref(`/users/${myId}`);
      const chatRef = database().ref(`/chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');
      const userSnapshot = await userRef.once('value');

      let userData = userSnapshot.val();
      const countChat = userData.countChat || 0;

      if (!userSnapshot.exists()) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
        return;
      }

      if (!chatSnapshot.exists()) {
        // Nếu cuộc trò chuyện chưa tồn tại, tạo mới
        await chatRef.set({
          users: {[userId]: true, [myId]: true},
      
        });
      }

      // Gửi tin nhắn
      const newMessageRef = chatRef.child('messages').push();
      await newMessageRef.set({
        senderId: myId,
        text: encryptMessage(text, secretKey),
        timestamp: database.ServerValue.TIMESTAMP,
        selfDestruct: isSelfDestruct,
      });

      // Cập nhật số lượng tin nhắn đã gửi
      await userRef.update({countChat: countChat + 1});

      setText('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  // 🔹 Xóa tin nhắn cả hai
  const deleteMessageForBoth = async messageId => {
    try {
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== messageId),
      );
    } catch (error) {
      console.error('Lỗi khi xóa tin nhắn:', error);
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
    database().ref(`/chats/${chatId}`).update({
      typing: {
        userId: myId,
        isTyping: isTyping,
      },
      users: {[userId]: true, [myId]: true},
    });
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

          <Text style={styles.remainingText}>
        {remainingMessages > 0
          ? `Còn ${remainingMessages} lượt nhắn tin`
          : `Hãy chờ ${countdown}s để tiếp tục`}
      </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View
              style={
                item.senderId === myId
                  ? styles.sentWrapper
                  : styles.receivedWrapper
              }>
              {item.senderId !== myId && (
                <Image source={{uri: img}} style={styles.avatar} />
              )}
              <TouchableOpacity
                onLongPress={() => confirmDeleteMessage(item.id)}
                style={
                  item.senderId === myId
                    ? styles.sentContainer
                    : styles.receivedContainer
                }>
                {item.senderId !== myId && (
                  <Text style={styles.usernameText}>{username}</Text>
                )}
                <Text
                  style={
                    item.senderId === myId
                      ? styles.SendmessageText
                      : styles.ReceivedmessageText
                  }>
                  {item.text}
                </Text>
                <Text
                  style={
                    item.senderId === myId
                      ? styles.SendmessageText
                      : styles.ReceivedmessageText
                  }>
                  <Text
                    style={
                      item.senderId === myId
                        ? styles.Sendtimestamp
                        : styles.Revecivedtimestamp
                    }>
                    {item.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          
        />
 {isTyping && <Text style={styles.typingText}>Đang nhập...</Text>}
        <View style={styles.inputContainer}>
          
          <TouchableOpacity
            onPress={() => setIsSelfDestruct(!isSelfDestruct)}
            style={styles.iconButton}>
            <Icon
              name={isSelfDestruct ? 'timer-sand' : 'timer-off'}
              size={24}
              color={isSelfDestruct ? 'red' : '#007bff'}
            />
          </TouchableOpacity>

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
              editable={remainingMessages > 0} // Chỉ cho nhập khi còn lượt nhắn
            />
          </View>

          <TouchableOpacity
          
            onPress={sendMessage}
            disabled={!text.trim() || remainingMessages === 0}
            style={[styles.disendButton, remainingMessages === 0 && styles.disabledButton]}>
            <Icon
              name="send"
              size={24}
              color={text.trim() || remainingMessages  === 0 ? '#007bff' : '#aaa'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10, backgroundColor: '#f5f5f5'},
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
  },
  receivedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {width: 40, height: 40, borderRadius: 20, marginRight: 8},
  usernameText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sentContainer: {
    backgroundColor: '#002DE3',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    alignSelf: 'flex-end',
    marginBottom: 10, // Thêm khoảng cách giữa các tin nhắn gửi
  },
  receivedContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    marginBottom: 10, // Thêm khoảng cách giữa các tin nhắn nhận
  },

  SendmessageText: {fontSize: 16, color: '#FFFFFF'},
  ReceivedmessageText: {fontSize: 16, color: '#0F1828'},
  deletedText: {fontSize: 16, color: '#999', fontStyle: 'italic'},
  Sendtimestamp: {
    fontSize: 12,
    color: '#FFFFFF',
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
  input: {flex: 1, padding: 8, fontSize: 16, backgroundColor: '#F7F7FC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Để phần này chiếm hết không gian trống
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000E08',
    marginLeft: 10, // Thêm khoảng cách với avatar
  },

  iconContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  backButton: {
    padding: 5,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },

  inputWrapper: {
    flex: 1, // Chiếm hết phần còn lại
    backgroundColor: '#F7F7FC',
    borderRadius: 10,
    marginRight: 10, // Tạo khoảng cách với nút gửi
  },

  input: {
    fontSize: 16,
    color: '#0F1828',
  },

  sendButton: {
    padding: 10,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5, // Làm mờ nút khi bị vô hiệu hóa
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
  remainingText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 14,
    marginBottom: 5,
  },
  
});

export default Single;

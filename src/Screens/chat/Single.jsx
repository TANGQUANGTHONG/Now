import React, {useState, useEffect} from 'react';
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

  // 🔹 Lấy tin nhắn realtime
  useEffect(() => {
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

    return () => messagesRef.off('value', onMessageChange);
  }, [chatId, secretKey]);

  // 🔹 Gửi tin nhắn
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const chatRef = database().ref(`/chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');

      if (!chatSnapshot.exists()) {
        await chatRef.set({users: {[userId]: true, [myId]: true}});
      }

      const newMessageRef = chatRef.child('messages').push();
      await newMessageRef.set({
        senderId: myId,
        text: encryptMessage(text, secretKey),
        timestamp: database.ServerValue.TIMESTAMP,
        selfDestruct: isSelfDestruct, // Lưu trạng thái tin nhắn tự hủy
      });

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

          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={() => console.log('Call')}
              style={styles.iconButton}>
              <Icon name="phone" size={24} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => console.log('Video Call')}
              style={styles.iconButton}>
              <Icon name="video" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
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
                  {item.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

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
              onChangeText={setText}
              placeholder="Nhập tin nhắn..."
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
});

export default Single;

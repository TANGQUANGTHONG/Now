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
import {getFirestore, serverTimestamp} from '@react-native-firebase/firestore';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
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
  const firestore = getFirestore();
  const [hiddenMessages, setHiddenMessages] = useState([]);

  const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;

  // lấy tin nhắn
  // useEffect(() => {
  //   const messagesRef = firestore
  //     .collection('chats')
  //     .doc(chatId)
  //     .collection('messages')
  //     .orderBy('timestamp', 'asc');

  //   const unsubscribe = messagesRef.onSnapshot(snapshot => {
  //     const msgs = snapshot.docs.map(doc => {
  //       const data = doc.data();
  //       return {
  //         id: doc.id,
  //         senderId: data.senderId,
  //         text:
  //           data.text === encryptMessage('Đã xóa tin nhắn')
  //             ? 'Đã xóa tin nhắn'
  //             : decryptMessage(data.text),
  //         timestamp: data.timestamp ? data.timestamp.toDate() : new Date(), // Chuyển timestamp thành Date
  //       };
  //     });
  //     setMessages(msgs);
  //   });

  //   return () => unsubscribe();
  // }, [chatId]);

// lấy tin nhắn realtime
useEffect(() => {
  const messagesRef = database().ref(`/chats/${chatId}/messages`);
  
  const onMessageChange = messagesRef.on('value', snapshot => {
    if (snapshot.exists()) {
      // Lấy dữ liệu từ snapshot và chuyển nó thành mảng tin nhắn
      const msgs = Object.entries(snapshot.val()).map(([id, data]) => ({
        id,
        senderId: data.senderId,
        text:
          data.text === encryptMessage('Đã xóa tin nhắn')
            ? 'Đã xóa tin nhắn'
            : decryptMessage(data.text),
        timestamp: new Date(data.timestamp), // Đảm bảo timestamp là đối tượng Date
      }));
      
      // Sắp xếp tin nhắn theo thời gian tăng dần
      const sortedMessages = msgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
    }
  });

  return () => messagesRef.off('value', onMessageChange);
}, [chatId]);

  

  // gửi tin nhắn
  // const sendMessage = async () => {
  //   if (!text.trim()) return;

  //   try {
  //     const chatRef = firestore.collection('chats').doc(chatId);
  //     const chatSnapshot = await chatRef.get();
  //     if (!chatSnapshot.exists) {
  //       await chatRef.set({users: [userId, myId]});
  //     }

  //     await chatRef.collection('messages').add({
  //       senderId: myId,
  //       text: encryptMessage(text),
  //       timestamp: serverTimestamp(),
  //     });

  //     setText('');
  //   } catch (error) {
  //     console.error('Lỗi khi gửi tin nhắn:', error);
  //   }
  // };

  // realtime gửi tin nhắn
  const sendMessage = async () => {
    if (!text.trim()) return;
  
    try {
      const chatRef = database().ref(`/chats/${chatId}`);
  
      // Kiểm tra xem cuộc trò chuyện đã tồn tại chưa
      const chatSnapshot = await chatRef.once('value');
  
      if (!chatSnapshot.exists()) {
        // Nếu chưa có, tạo mới với danh sách user
        await chatRef.set({
          users: {
            [userId]: true,
            [myId]: true
          }
        });
      }
  
      // Thêm tin nhắn vào danh sách messages
      const newMessageRef = chatRef.child('messages').push();
      await newMessageRef.set({
        senderId: myId,
        text: encryptMessage(text),
        timestamp: database.ServerValue.TIMESTAMP,
      });
  
      setText('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
    console.log('user:', userId);
    console.log('myid:', myId);
  };
  
  

  // xóa tin nhắn phía bạn
  // const deleteMessageForMe = async messageId => {
  //   setHiddenMessages(prev => [...prev, messageId]); // Thêm vào danh sách các tin nhắn đã bị ẩn
  //   try {
  //     await firestore
  //       .collection('chats')
  //       .doc(chatId)
  //       .collection('messages')
  //       .doc(messageId)
  //       .update({
  //         deleted: true, // Chỉ đánh dấu là đã xóa (ẩn) chứ không thay đổi nội dung
  //       });
        

  //     // Cập nhật lại danh sách tin nhắn trong trạng thái
  //     setMessages(prevMessages =>
  //       prevMessages.map(msg =>
  //         msg.id === messageId ? {...msg, deleted: true} : msg,
  //       ),
  //     );
  //   } catch (error) {
  //     console.error('Lỗi khi xóa tin nhắn phía bạn:', error);
  //   }
  // };

// xóa tin nhắn phía bạn realtime
  const deleteMessageForMe = async messageId => {
    setHiddenMessages(prev => [...prev, messageId]);
  };
  

  // xóa tin nhắn cả hai
  // const deleteMessageForBoth = async messageId => {
  //   try {
  //     await firestore
  //       .collection('chats')
  //       .doc(chatId)
  //       .collection('messages')
  //       .doc(messageId)
  //       .delete();

  //     setMessages(prevMessages =>
  //       prevMessages.filter(msg => msg.id !== messageId),
  //     );
  //   } catch (error) {
  //     console.error('Lỗi khi xóa tin nhắn:', error);
  //   }
  // };


  // xóa tin nhắn cả hai realtime
  const deleteMessageForBoth = async messageId => {
    try {
      await database().ref(`/chats/${chatId}/messages/${messageId}`).remove();
  
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Lỗi khi xóa tin nhắn:', error);
    }
  };
  

  // xác nhận xóa tin nhắn
  const confirmDeleteMessage = messageId => {
    Alert.alert(
      'Xóa tin nhắn',
      'Bạn muốn xóa tin nhắn này phía bạn hay cả hai?',
      [
        {text: 'Hủy', style: 'cancel'},
        // { text: 'Xóa phía bạn', onPress: () => deleteMessageForMe(messageId) }, // Gọi hàm chỉ ẩn tin nhắn
        {text: 'Xóa cả hai', onPress: () => deleteMessageForBoth(messageId)},
      ],
    );
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
          data={messages.filter(
            msg => !hiddenMessages.includes(msg.id) && !msg.deleted,
          )} // Chỉ lọc ra tin nhắn chưa bị ẩn
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
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestamp}>
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
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
          />
          <TouchableOpacity onPress={sendMessage} disabled={!text.trim()}>
            <Icon
              name={text.trim() ? 'send' : 'microphone'}
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
    backgroundColor: '#20A090',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    alignSelf: 'flex-end',
    marginBottom: 10, // Thêm khoảng cách giữa các tin nhắn gửi
  },
  receivedContainer: {
    backgroundColor: '#F2F7FB',
    padding: 12,
    borderRadius: 20,
    maxWidth: '70%',
    marginBottom: 10, // Thêm khoảng cách giữa các tin nhắn nhận
  },

  messageText: {fontSize: 16, color: '#000E08'},
  deletedText: {fontSize: 16, color: '#999', fontStyle: 'italic'},
  timestamp: {fontSize: 12, color: '#666', marginTop: 5, alignSelf: 'flex-end'},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 20,
    marginTop: 10,
    backgroundColor: 'white',
  },
  input: {flex: 1, padding: 8, fontSize: 16},
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
  iconButton: {
    padding: 5,
  },
  backButton: {
    padding: 5,
  },
});

export default Single;

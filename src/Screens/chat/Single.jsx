import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
const Single = () => {
  const route = useRoute();
  const {userId, myId, myUsername, username, img} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  console.log('Người gửi (myId):', myId);
  console.log('Người nhận (userId):', userId);

  useEffect(() => {
    const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;

    const messagesRef = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    const unsubscribe = messagesRef
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data()
          return{
            id: doc.id,
            text: decryptMessage(data.text),
            timestamp: data.timestamp
          }
          // id: doc.id,
          // ...doc.data(),
        });
        setMessages(msgs);
      });

    return () => unsubscribe(); // Hủy lắng nghe khi component unmount
  }, [userId, myId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;

    const chatRef = firestore().collection('chats').doc(chatId);

    try {
      const chatSnapshot = await chatRef.get();

      if (!chatSnapshot.exists) {
        await chatRef.set({users: [userId, myId]});
      }

      await chatRef.collection('messages').add({
        senderId: myId, // Sửa userId thành myId
        text: encryptMessage(text),
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      setText('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.username}>{username}</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View
            style={
              item.senderId === myId
                ? styles.sentContainer // Tin nhắn do mình gửi
                : styles.receivedContainer // Tin nhắn do người khác gửi
            }>
            <Text
              style={
                item.senderId === myId ? styles.sentText : styles.receivedText
              }>
              {item.text}
            </Text>
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
        <Button title="Gửi" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  sentContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
    maxWidth: '70%',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
    maxWidth: '70%',
  },
  sentText: {
    color: 'black',
  },
  receivedText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginRight: 5,
  },
});

export default Single;

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const ChatScreen = ({route}) => {
  const {groupId} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const authInstance = getAuth();
  const userId = authInstance.currentUser?.uid;

  useEffect(() => {
    const db = getFirestore();
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('groupId', '==', groupId),
      orderBy('timestamp', 'asc'),
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [groupId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const db = getFirestore();
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      groupId,
      senderId: userId,
      text,
      timestamp: serverTimestamp(),
    });
    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View
            style={item.senderId === userId ? styles.sent : styles.received}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    padding: 10,
    marginBottom: 5,
    borderRadius: 10,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    padding: 10,
    marginBottom: 5,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  send: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
  },
});

export default ChatScreen;

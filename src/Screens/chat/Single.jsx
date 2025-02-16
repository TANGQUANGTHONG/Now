// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
// } from 'react-native';
// import {useRoute} from '@react-navigation/native';
// import firestore from '@react-native-firebase/firestore';
// import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// const Single = () => {
//   const route = useRoute();
//   const {userId, myId, myUsername, username, img} = route.params;
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState('');

//   useEffect(() => {
//     const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;

//     const messagesRef = firestore()
//       .collection('chats')
//       .doc(chatId)
//       .collection('messages');

//     const unsubscribe = messagesRef.orderBy('timestamp', 'asc').onSnapshot(snapshot => {
//       const msgs = snapshot.docs.map(doc => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           senderId: data.senderId,
//           text: decryptMessage(data.text),
//           timestamp: data.timestamp,
//         };
//       });
//       setMessages(msgs);
//     });

//     return () => unsubscribe();
//   }, [userId, myId]);

//   const sendMessage = async () => {
//     if (!text.trim()) return;

//     const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;

//     const chatRef = firestore().collection('chats').doc(chatId);

//     try {
//       const chatSnapshot = await chatRef.get();
//       if (!chatSnapshot.exists) {
//         await chatRef.set({users: [userId, myId]});
//       }

//       await chatRef.collection('messages').add({
//         senderId: myId,
//         text: encryptMessage(text),
//         timestamp: firestore.FieldValue.serverTimestamp(),
//       });

//       setText('');
//     } catch (error) {
//       console.error('Lỗi khi gửi tin nhắn:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.username}>{username}</Text>
//       <FlatList
//         data={messages}
//         keyExtractor={item => item.id}
//         renderItem={({item}) => (
//           <View
//             style={
//               item.senderId === myId
//                 ? styles.sentContainer
//                 : styles.receivedContainer
//             }>
//             <Text
//               style={
//                 item.senderId === myId ? styles.sentText : styles.receivedText
//               }>
//               {item.text}
//             </Text>
//           </View>
//         )}
//       />

//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           value={text}
//           onChangeText={setText}
//           placeholder="Nhập tin nhắn..."
//         />
//         <TouchableOpacity onPress={sendMessage} disabled={!text.trim()}>
//           <Icon
//             name={text.trim() ? 'send' : 'microphone'}
//             size={24}
//             color={text.trim() ? '#007bff' : '#aaa'}
//           />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//   },
//   username: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginVertical: 10,
//   },
//   sentContainer: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#dcf8c6',
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 5,
//     maxWidth: '70%',
//   },
//   receivedContainer: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#f1f1f1',
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 5,
//     maxWidth: '70%',
//   },
//   sentText: {
//     color: 'black',
//   },
//   receivedText: {
//     color: 'black',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 8,
//     borderRadius: 8,
//     marginTop: 10,
//   },
//   input: {
//     flex: 1,
//     padding: 8,
//     fontSize: 16,
//   },
// });

// export default Single;

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Single = ({route}) => {
  const {groupId, userId} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('messages')
      .where('groupId', '==', groupId)
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

    return () => unsubscribe();
  }, [groupId]);

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(groupId, userId, text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View
            style={item.senderId === userId ? styles.sent : styles.received}>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend}>
          <Icon name="send" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  text: {color: 'black'},
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
    padding: 8,
    borderRadius: 8,
  },
});

export default Single;

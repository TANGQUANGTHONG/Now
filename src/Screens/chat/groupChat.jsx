import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupChat = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {groupId, groupName, members} = route.params || {};
  const currentUser = auth().currentUser;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const messagesRef = database().ref(`/groups/${groupId}/messages`);
    messagesRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const messagesArray = Object.entries(snapshot.val()).map(
          ([id, data]) => ({id, ...data}),
        );
        setMessages(messagesArray.sort((a, b) => a.timestamp - b.timestamp));
      }
    });
    return () => messagesRef.off('value');
  }, [groupId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const messageRef = database().ref(`/groups/${groupId}/messages`).push();
    await messageRef.set({
      senderId: currentUser.uid,
      text,
      timestamp: Date.now(),
    });
    setText('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupMembers', {groupId})}>
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.groupName}>{groupName}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View
              style={
                item.senderId === currentUser.uid
                  ? styles.sent
                  : styles.received
              }>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
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
          <TouchableOpacity onPress={sendMessage}>
            <Icon name="send" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#000',
  },
  groupName: {fontSize: 18, color: '#FFF', marginLeft: 10},
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#99F2C8',
    padding: 10,
    borderRadius: 10,
    margin: 5,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    margin: 5,
  },
  messageText: {fontSize: 16},
  timestamp: {fontSize: 12, color: '#888', textAlign: 'right'},
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  input: {flex: 1, padding: 8, fontSize: 16},
});

export default GroupChat;

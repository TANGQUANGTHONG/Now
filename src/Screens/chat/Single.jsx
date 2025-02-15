import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
// import storage from '@react-native-firebase/storage';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
const Single = () => {
  const route = useRoute();
  const {userId, myId, myUsername, username, img} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
          const data = doc.data();
          return {
            id: doc.id,
            text: decryptMessage(data.text),
            timestamp: data.timestamp,
          };
          // id: doc.id,
          // ...doc.data(),
        });
        setMessages(msgs);
      });

    return () => unsubscribe();
  }, [userId, myId]);

  const sendMessage = async () => {
    if (!text.trim() && !selectedImage) return;

    const chatId = userId < myId ? `${userId}_${myId}` : `${myId}_${userId}`;
    const chatRef = firestore().collection('chats').doc(chatId);

    try {
      let imageUrl = null;
      if (selectedImage) {
        const filename = `${Date.now()}.jpg`;
        const storageRef = storage().ref(`chat_images/${filename}`);
        await storageRef.putFile(selectedImage);
        imageUrl = await storageRef.getDownloadURL();

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
        setSelectedImage(null); // Xóa ảnh đã chọn sau khi gửi
      }
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    }

    // const pickImage = () => {
    //   launchImageLibrary({ mediaType: 'photo' }, response => {
    //     if (response.didCancel || response.error) {
    //       console.log('Người dùng hủy chọn ảnh hoặc lỗi:', response.error);
    //       return;
    //     }

    //     const imageUri = response.assets[0].uri;
    //     setSelectedImage(imageUri); // Hiển thị ảnh trước khi gửi
    //   });
    // };

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
                  ? styles.sentContainer
                  : styles.receivedContainer
              }>
              {item.imageUrl ? (
                <Image source={{uri: item.imageUrl}} style={styles.image} />
              ) : (
                <Text
                  style={
                    item.senderId === myId
                      ? styles.sentText
                      : styles.receivedText
                  }>
                  {item.text}
                </Text>
              )}
            </View>
          )}
        />

        {/* Thanh nhập tin nhắn */}
        <View style={styles.inputContainer}>
          {/* Hiển thị ảnh đã chọn trước khi gửi */}
          {selectedImage && (
            <View style={{alignItems: 'center', marginBottom: 5}}>
              <Image
                source={{uri: selectedImage}}
                style={{width: 100, height: 100, borderRadius: 10}}
              />
            </View>
          )}

          {/* Nút chọn ảnh */}
          {/* <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
          <Icon name="image" size={30} color="gray" />
        </TouchableOpacity> */}

          <View style={styles.iconButton}>
            <Icon name="image" size={30} color="gray" />
          </View>

          {/* Ô nhập tin nhắn */}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
          />

          {/* Nút gửi hoặc ghi âm */}
          <TouchableOpacity
            onPress={
              text.trim() || selectedImage
                ? sendMessage
                : () => console.log('Ghi âm')
            }>
            {text.trim() || selectedImage ? (
              <Icon name="send" size={30} color="#007bff" />
            ) : (
              <FontAwesome name="microphone" size={30} color="gray" />
            )}
          </TouchableOpacity>
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
    image: {
      width: 200,
      height: 200,
      borderRadius: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderTopWidth: 1,
      borderColor: '#ccc',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 8,
      marginHorizontal: 5,
      borderRadius: 5,
    },
    iconButton: {
      padding: 5,
    },
  });
};
export default Single;

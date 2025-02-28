import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Item_home_chat from '../../components/items/Item_home_chat';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase, ref, onValue, get, orderByChild, query, limitToLast, update } from '@react-native-firebase/database';
import { encryptMessage, decryptMessage, generateSecretKey } from '../../cryption/Encryption';
import { oStackHome } from '../../navigations/HomeNavigation';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // 🔥 Import useFocusEffect


const { width, height } = Dimensions.get('window');
const Home = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const auth = getAuth();
  const db = getDatabase();
  const myId = auth.currentUser?.uid;
  const [storageChanged, setStorageChanged] = useState(false);

  const secretkey = "2ka3an/XJPjljtj0PbSMVAP50Rlv5HWFIwHBCWD4yIM="

  // console.log("chatlist",chatList)

  useEffect(() => {
    const loadChats = async () => {
      try {
        // 🔥 Lấy dữ liệu từ AsyncStorage trước
        const storedChats = await AsyncStorage.getItem('chatList');
        if (storedChats) {
          setChatList(JSON.parse(storedChats));
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
      }
  
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
  
      const chatRef = ref(db, 'chats');
  
      onValue(chatRef, async snapshot => {
        if (!snapshot.exists()) {
          console.log('🔥 Firebase không có dữ liệu, lấy từ AsyncStorage.');
          return;
        }
  
        const chatsData = snapshot.val();
        const chatEntries = Object.entries(chatsData);
  
        const chatPromises = chatEntries.map(async ([chatId, chat]) => {
          if (!chat.users || !chat.users[currentUserId]) return null;
  
          const otherUserId = Object.keys(chat.users).find(uid => uid !== currentUserId);
          if (!otherUserId) return null;
  
          const userRef = ref(db, `users/${otherUserId}`);
          const userSnapshot = await get(userRef);
          if (!userSnapshot.exists()) return null;
  
          const userInfo = userSnapshot.val();
          const decryptedName = safeDecrypt(userInfo?.name);
          const decryptedImage = safeDecrypt(userInfo?.Image);
  
          let lastMessage = '';
          let lastMessageTime = '';
          let lastMessageTimestamp = 0;
          let unreadCount = 0; // 🔥 Số tin nhắn chưa đọc
  
          // 🔥 Kiểm tra tin nhắn trên Firebase
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          const messagesSnapshot = await get(messagesRef);
  
          if (messagesSnapshot.exists()) {
            const messagesData = messagesSnapshot.val();
            const sortedMessages = Object.entries(messagesData)
              .map(([msgId, msg]) => ({ msgId, ...msg }))
              .sort((a, b) => b.timestamp - a.timestamp); // Sắp xếp theo thời gian giảm dần
  
            if (sortedMessages.length > 0) {
              const latestMessage = sortedMessages[0];
              lastMessage = decryptMessage(latestMessage.text, secretkey) || 'Tin nhắn bị mã hóa';
              lastMessageTime = new Date(latestMessage.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              lastMessageTimestamp = latestMessage.timestamp;
  
              // 🔥 Đếm tin nhắn chưa đọc chỉ nếu tin nhắn không thuộc currentUserId
              unreadCount = sortedMessages.filter(
                msg => msg.status !== 'read' && msg.senderId !== currentUserId
              ).length;
            }
          } else {
            console.log(`🔥 Không có tin nhắn trên Firebase, lấy từ local: ${chatId}`);
  
            // 🔥 Lấy tin nhắn từ AsyncStorage nếu Firebase không có dữ liệu
            const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
            if (storedMessages) {
              const parsedMessages = JSON.parse(storedMessages);
              if (parsedMessages.length > 0) {
                const latestLocalMessage = parsedMessages[parsedMessages.length - 1];
                lastMessage =  latestLocalMessage.text || 'Tin nhắn bị mã hóa';
                lastMessageTime = new Date(latestLocalMessage.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                lastMessageTimestamp = latestLocalMessage.timestamp;
  
                // 🔥 Đếm số tin nhắn chưa đọc từ local storage
                unreadCount = parsedMessages.filter(
                  msg => msg.status !== 'read' && msg.senderId !== currentUserId
                ).length;
              }
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
            unreadCount, // 🔥 Hiển thị số tin nhắn chưa đọc
          };
        });
  
        const resolvedChats = await Promise.all(chatPromises);
        const filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
  
        // 🔥 Lưu vào AsyncStorage để dùng nếu Firebase rỗng sau này
        await AsyncStorage.setItem('chatList', JSON.stringify(filteredChats));
        setChatList(filteredChats);
        setStorageChanged(prev => !prev); // 🔥 Đánh dấu AsyncStorage thay đổi
      });
    };
  
    loadChats();
  }, []);
  
  
  
  // Giải mã tin nhắn
  const safeDecrypt = (encryptedText, secretKey) => {
    try {
      if (!encryptedText) return 'Nội dung trống';
  
      const decryptedText = decryptMessage(encryptedText, secretKey);
  
      if (!decryptedText || decryptedText === '❌ Lỗi giải mã') {
        return 'Tin nhắn bị mã hóa';
      }
  
      return decryptedText;
    } catch (error) {
      return 'Tin nhắn bị mã hóa';
    }
  };
  
  // Xử lý nhấn vào người dùng
  const handleUserPress = async (userId, username, img, chatId) => {
    const myId = auth.currentUser?.uid;
    if (!myId || !chatId) return;
  
    // ✅ Load tin nhắn từ AsyncStorage trước khi vào màn hình chat
    // const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    // const messages = storedMessages ? JSON.parse(storedMessages) : [];
  
    navigation.navigate(oStackHome.Single.name, {
      userId,
      myId,
      username,
      img,
      // messages, // ✅ Gửi luôn tin nhắn đã lưu qua navigation
    });
  
   
  };
  
  // Kiểm tra và xóa tin nhắn nếu cả hai đã lưu
  const checkAndDeleteMessages = async (chatId, userId) => {
    try {
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      const snapshot = await get(messagesRef);
  
      if (!snapshot.exists()) return;
  
      const messages = snapshot.val();
      const updates = {};
      const myId = auth.currentUser?.uid;
      if (!myId) return;
  
      Object.entries(messages).forEach(([messageId, messageData]) => {
        const savedByUser1 = messageData.saved?.[myId] || false;
        const savedByUser2 = messageData.saved?.[userId] || false;
  
        if (savedByUser1 && savedByUser2) {
          updates[`/chats/${chatId}/messages/${messageId}`] = null; // Xóa messageID hoàn toàn
        }
      });
  
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        console.log(`✅ Đã xóa ${Object.keys(updates).length} tin nhắn.`);
      } else {
        console.log("⏳ Không có tin nhắn nào đủ điều kiện để xóa.");
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra và xóa tin nhắn:', error);
    }
  };
  
  
  

  return (
    <View style={styles.container}>
      <View style={{marginHorizontal: 20}}>
        <View style={styles.boxHeader}>

          {/* <Text >Chats</Text> */}
          <MaskedView
            maskElement={
              <Text style={[styles.txtHeader, { backgroundColor: 'transparent', color: "#99F2C8" }]}>
                Chats
              </Text>
            }
          >
            <LinearGradient
              colors={['#438875', '#99F2C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {/* Invisible text to preserve spacing */}
              <Text style={[styles.txtHeader, { opacity: 0 }]}>Chats</Text>
            </LinearGradient>
          </MaskedView>

          <View style={styles.boxIconHeader}>
            <Icon name="chatbox-ellipses-outline" size={25} color='white' />
            <Icon name="ellipsis-vertical" size={25} color='white' />
          </View>
        </View>
        <View style={styles.inputSearch}>
          <View style={{marginLeft: '3%'}}>
            <Icon name="search-outline" size={25} color="black" />
          </View>
          <TextInput
            style={styles.search}
            placeholder='Search for a chat...'
            placeholderTextColor={"black"}
            onPress={() => navigation.navigate("Search")}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Gemini')}>
          <View style={styles.container_item}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={{
                  uri: 'https://static.vecteezy.com/system/resources/previews/010/054/157/non_2x/chat-bot-robot-avatar-in-circle-round-shape-isolated-on-white-background-stock-illustration-ai-technology-futuristic-helper-communication-conversation-concept-in-flat-style-vector.jpg',
                }}
                style={styles.img}
              />
              <Text style={styles.text_name_AI}>AI Chat</Text>
            </View>
          </View>
        </TouchableOpacity>

        
        <FlatList
  data={chatList}
  renderItem={({item}) => (
    <Item_home_chat
      data_chat={item}
      onPress={() =>
        handleUserPress(item.id, item.name, item.img, item.chatId)
      }
    >
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </Item_home_chat>
  )}
  keyExtractor={item => item.chatId}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{paddingBottom: 150, paddingTop: 30}}
/>


      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  boxIconHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  txtHeader: {
    fontSize: 20,
    // color: 'black',
    fontWeight: 'bold'
  },
  inputSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FC',
    padding: 3,
    borderRadius: 30
  },
  search: {
    flex: 1,
    padding: 10,
  },
  img: {
    width: 60,
    height: 60 ,
    borderRadius: 50,
  },
  container_item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20
    // width: '100%',
    // height: '0%',
    // marginLeft: 12,
    // backgroundColor: 'black',
    // borderWidth: 5,
  },
  text_name_AI: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft:10,
    color:"#FFFFFF",
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
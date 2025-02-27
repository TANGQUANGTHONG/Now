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

const { width, height } = Dimensions.get('window');
const Home = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;
  
    const chatRef = ref(db, 'chats');
  
    onValue(chatRef, async snapshot => {
      if (!snapshot.exists()) return;
  
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
  
        const secretKey = generateSecretKey(otherUserId, currentUserId);
  
        const lastMessageRef = query(
          ref(db, `chats/${chatId}/messages`),
          orderByChild('timestamp'),
          limitToLast(1),
        );
        const lastMessageSnapshot = await get(lastMessageRef);
  
        let lastMessage = 'Chưa có tin nhắn';
        let lastMessageTime = '';
        let lastMessageTimestamp = 0;
  
        if (lastMessageSnapshot.exists()) {
          const lastMessageData = Object.values(lastMessageSnapshot.val())[0];
          lastMessage =
            decryptMessage(lastMessageData.text, secretKey) || 'Tin nhắn bị mã hóa';
          lastMessageTime = new Date(lastMessageData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          lastMessageTimestamp = lastMessageData.timestamp;
        }
  
        // ✅ Tính số tin nhắn chưa đọc
        const allMessagesRef = query(ref(db, `chats/${chatId}/messages`));
        const allMessagesSnapshot = await get(allMessagesRef);
  
        let unreadCount = 0;
        if (allMessagesSnapshot.exists()) {
          const allMessages = Object.values(allMessagesSnapshot.val());
          unreadCount = allMessages.filter(
            msg => msg.seen?.[currentUserId] === false,
          ).length;
        }
  
        return {
          chatId,
          id: otherUserId,
          name: decryptedName || 'Người dùng',
          img: decryptedImage || 'https://example.com/default-avatar.png',
          text: lastMessage,
          time: lastMessageTime,
          timestamp: lastMessageTimestamp,
          unreadCount, // 🔥 Thêm số tin nhắn chưa đọc vào dữ liệu
        };
      });
  
      const resolvedChats = await Promise.all(chatPromises);
      const filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
  
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('chatList', JSON.stringify(filteredChats));
      setChatList(filteredChats);
    });
  }, []);
  
  
  useEffect(() => {
    const loadLocalChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chatList');
        if (storedChats) {
          const parsedChats = JSON.parse(storedChats);
          setChatList(parsedChats);
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
      }
    };
  
    loadLocalChats(); // Lấy dữ liệu từ AsyncStorage trước khi lắng nghe Firebase
  
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;
    
    const chatRef = ref(db, 'chats');
    
    onValue(chatRef, async snapshot => {
      if (!snapshot.exists()) return;
    
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
    
        const secretKey = generateSecretKey(otherUserId, currentUserId);
    
        const lastMessageRef = query(
          ref(db, `chats/${chatId}/messages`),
          orderByChild('timestamp'),
          limitToLast(1),
        );
        const lastMessageSnapshot = await get(lastMessageRef);
    
        let lastMessage = 'Chưa có tin nhắn';
        let lastMessageTime = '';
        let lastMessageTimestamp = 0;
    
        if (lastMessageSnapshot.exists()) {
          const lastMessageData = Object.values(lastMessageSnapshot.val())[0];
          lastMessage =
            decryptMessage(lastMessageData.text, secretKey) || 'Tin nhắn bị mã hóa';
          lastMessageTime = new Date(lastMessageData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          lastMessageTimestamp = lastMessageData.timestamp;
        }
    
        return {
          chatId,
          id: otherUserId,
          name: decryptedName || 'Người dùng',
          img: decryptedImage || 'https://example.com/default-avatar.png',
          text: lastMessage,
          time: lastMessageTime,
          timestamp: lastMessageTimestamp,
        };
      });
    
      const resolvedChats = await Promise.all(chatPromises);
      const filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
  
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('chatList', JSON.stringify(filteredChats));
      setChatList(filteredChats);
    });
  }, []);
  
  

  const safeDecrypt = (encryptedText, userId, myId) => {
    try {
      if (!encryptedText) return 'Nội dung trống';

      // Giải mã bằng khóa bí mật của phòng chat
      const decryptedText = decryptMessage(encryptedText, userId, myId);

      // Kiểm tra nếu giải mã thất bại
      if (!decryptedText || decryptedText === '❌ Lỗi giải mã') {
        return 'Tin nhắn bị mã hóa';
      }

      return decryptedText;
    } catch (error) {
      // console.error("❌ Lỗi giải mã:", error);
      return 'Tin nhắn bị mã hóa';
    }
  };

  const handleUserPress = async (userId, username, img, chatId) => {
    const myId = auth.currentUser?.uid;
    if (!myId || !chatId) return;
  
    // ✅ Load tin nhắn từ AsyncStorage trước khi vào màn hình chat
    const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
  
    navigation.navigate(oStackHome.Single.name, {
      userId,
      myId,
      username,
      img,
      messages, // ✅ Gửi luôn tin nhắn đã lưu qua navigation
    });
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

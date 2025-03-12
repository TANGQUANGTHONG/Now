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
  LogBox,
  Modal,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';

import Item_home_chat from '../../components/items/Item_home_chat';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase, ref, onValue, get, orderByChild, query, limitToLast, update } from '@react-native-firebase/database';
import { encryptMessage, decryptMessage, generateSecretKey, getSecretKey } from '../../cryption/Encryption';
import { oStackHome } from '../../navigations/HomeNavigation';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // 🔥 Import useFocusEffect


const { width, height } = Dimensions.get('window');
const Home = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const [pinnedChats, setpinnedChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const auth = getAuth();
  const db = getDatabase();
  const [storageChanged, setStorageChanged] = useState(false);
  const myId = auth.currentUser?.uid;
  const userId = "KKsCyrEpBSSoqMxlr9cuPHaz8fO2";
  // const secretKey = generateSecretKey(otherUserId, myId);

  // const secretkey = "2ka3an/XJPjljtj0PbSMVAP50Rlv5HWFIwHBCWD4yIM="

  // console.log("chatlist",secretKey)


  useEffect(() => {
    loadPinnedChats(); // Khi component được mount, tải danh sách tin nhắn đã ghim từ AsyncStorage
  }, []);


  const loadPinnedChats = async () => {
    try {
      const storedPinned = await AsyncStorage.getItem('pinnedChats'); // Lấy danh sách ghim từ AsyncStorage
      setpinnedChats(storedPinned ? JSON.parse(storedPinned) : []); // Chuyển dữ liệu từ chuỗi JSON về mảng
    } catch (error) {
      console.error("Lỗi khi tải danh sách ghim:", error);

    }
  }

  const togglePinChat = async (chatId) => {
    try {
      let updatedPinned;
      if (pinnedChats.includes(chatId)) {
        updatedPinned = pinnedChats.filter(id => id !== chatId); // Nếu đã ghim, bỏ ghim bằng cách loại bỏ ID khỏi mảng
      } else {
        updatedPinned = [...pinnedChats, chatId]; // Nếu chưa ghim, thêm ID vào mảng
      }

      setpinnedChats(updatedPinned);
      await AsyncStorage.setItem('pinnedChats', JSON.stringify(updatedPinned)); // Lưu danh sách mới vào AsyncStorage
      setModalVisible(false);
    } catch (error) {
      console.error("Lỗi khi ghim đoạn chat:", error);
    }
  };


 const handleLongPress = (chatId) => {
    setSelectedChat(chatId);
    setModalVisible(true);
  };


  const sortedChats = [...chatList].sort((a, b) => {
    const aPinned = pinnedChats.includes(a.chatId);
    const bPinned = pinnedChats.includes(b.chatId);
    if (aPinned === bPinned) {
      return b.timestamp - a.timestamp;
    }
    return aPinned ? -1 : 1;
  });


    LogBox.ignoreAllLogs();
    console.warn = () => { };

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('chatList');
      let chatListFromStorage = storedChats ? JSON.parse(storedChats) : [];
  
      // Sắp xếp danh sách chat theo timestamp khi lấy từ local
      chatListFromStorage.sort((a, b) => b.timestamp - a.timestamp);
  
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
  
      const chatRef = ref(db, 'chats');
  
      onValue(chatRef, async snapshot => {
        if (!snapshot.exists()) {
          // console.log('🔥 Không có tin nhắn mới trên Firebase, lấy từ local.');
          setChatList(chatListFromStorage); // Đặt lại danh sách đã sắp xếp
          return;
        }
  
        const chatsData = snapshot.val();
        const chatEntries = Object.entries(chatsData);
  
        const chatPromises = chatEntries.map(async ([chatId, chat]) => {
          if (!chat.users || !chat.users[currentUserId]) return null;
  
          const otherUserId = Object.keys(chat.users).find(uid => uid !== currentUserId);
          if (!otherUserId) return null;
  
          const secretKey = generateSecretKey(otherUserId, currentUserId);
          const userRef = ref(db, `users/${otherUserId}`);
          const userSnapshot = await get(userRef);
          if (!userSnapshot.exists()) return null;
  
          const userInfo = userSnapshot.val();
          const decryptedName = safeDecrypt(userInfo?.name);
          const decryptedImage = safeDecrypt(userInfo?.Image);
  
          let lastMessage = '';
          let lastMessageTime = '';
          let lastMessageTimestamp = 0;
          let unreadCount = 0;
          let lastMessageId = null;
          let isSeen = true;
  
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          const messagesSnapshot = await get(messagesRef);
  
          if (messagesSnapshot.exists()) {
            const messagesData = messagesSnapshot.val();
            const sortedMessages = Object.entries(messagesData)
              .map(([msgId, msg]) => ({ msgId, ...msg }))
              .sort((a, b) => b.timestamp - a.timestamp);
  
            if (sortedMessages.length > 0) {
              const latestMessage = sortedMessages[0];
              lastMessageId = latestMessage.msgId;
              if (latestMessage.imageUrl) {
                lastMessage = 'Có ảnh mới';
              } else {
                lastMessage = decryptMessage(latestMessage.text, secretKey) || 'Tin nhắn bị mã hóa';
              }
  
              lastMessageTime = new Date(latestMessage.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              lastMessageTimestamp = latestMessage.timestamp;
              isSeen = latestMessage?.seen?.[currentUserId] || false;
  
              unreadCount = isSeen ? 0 : sortedMessages.filter(
                msg => msg.senderId !== currentUserId && !msg.seen?.[currentUserId]
              ).length;
            }
          } else {
            // console.log(`📭 Không có tin nhắn trên Firebase cho chatId: ${chatId}, lấy từ local.`);
            const localMessage = await getLatestMessageFromLocal(chatId);
            lastMessage = localMessage.text;
            lastMessageTime = localMessage.time;
            lastMessageTimestamp = localMessage.timestamp; // Thêm timestamp từ local
            isSeen = localMessage.isSeen;
          }
  
          return {
            chatId,
            id: otherUserId,
            name: decryptedName || 'Người dùng',
            img: decryptedImage || 'https://example.com/default-avatar.png',
            text: lastMessage,
            time: lastMessageTime,
            timestamp: lastMessageTimestamp, // Lưu timestamp
            unreadCount,
            lastMessageId,
            isSeen,
          };
        });
  
        const resolvedChats = await Promise.all(chatPromises);
        let filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp); // Sắp xếp theo thời gian
        await AsyncStorage.setItem('chatList', JSON.stringify(filteredChats));
        setChatList(filteredChats);
      });
    } catch (error) {
      console.error('❌ Lỗi khi lấy dữ liệu:', error);
    }
  };
  

  //lấy tin mới nhất từ local 
  const getLatestMessageFromLocal = async (chatId) => {
    try {
      const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
  
      if (!storedMessages) {
        console.log(`📭 Không có tin nhắn nào trong local cho chatId: ${chatId}`);
        return { text: "", time: "", timestamp: 0, isSeen: false };
      }
  
      const messages = JSON.parse(storedMessages);
  
      if (messages.length === 0) {
        // console.log(`📭 Danh sách tin nhắn rỗng cho chatId: ${chatId}`);
        return { text: "", time: "", timestamp: 0, isSeen: false };
      }
  
      // Sắp xếp tin nhắn theo timestamp giảm dần để lấy tin nhắn mới nhất
      const latestMessage = messages.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return {
        text: latestMessage.text || "",
        time: new Date(latestMessage.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: latestMessage.timestamp, // Thêm timestamp để sắp xếp
        isSeen: latestMessage.seen?.[myId] || false,
      };
    } catch (error) {
      console.error("❌ Lỗi khi lấy tin nhắn mới nhất từ local:", error);
      return { text: "", time: "", timestamp: 0, isSeen: false };
    }
  };
  


  const updateLocalChatList = async (chatId, newMessage) => {
    try {
      const storedChats = await AsyncStorage.getItem('chatList');
      if (!storedChats) return;

      let chatList = JSON.parse(storedChats);
      let updatedChats = chatList.map(chat => {
        if (chat.chatId === chatId) {
          return { ...chat, text: newMessage || "", time: "" };
        }
        return chat;
      });

      await AsyncStorage.setItem('chatList', JSON.stringify(updatedChats));
      setChatList(updatedChats); // Cập nhật UI
    } catch (error) {
      console.error("❌ Lỗi cập nhật chatList:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChats(); // Gọi lại hàm loadChats khi quay lại Home
    }, [])
  );
  
  // Giải mã tin nhắn
  const safeDecrypt = (encryptedText, secretKey) => {
    try {
      if (!encryptedText) return 'Nội dung trống';

      const decryptedText = decryptMessage(encryptedText, secretKey);

      if (!decryptedText || decryptedText === '') {
        return 'Tin nhắn bị mã hóa';
      }

      return decryptedText;
    } catch (error) {
      return 'Tin nhắn bị mã hóa';
    }
  };

  // Xử lý nhấn vào người dùng
  // Khi nhấn vào chat, đánh dấu tin nhắn đã seen
  const handleUserPress = async (userId, username, img) => {
    if (!myId) return;

    const chatId = await getStoredChatId(userId); // 🔥 Lấy chatId từ local
    if (!chatId) {
      console.warn("⚠️ Không tìm thấy chatId trong local, dùng mặc định.");
      return;
    }

    navigation.navigate("Single", {
      userId,
      myId,
      username,
      img,
      chatId, // 🔥 Truyền chatId đã lưu từ local
    });
  };


  const getStoredChatId = async (userId) => {
    try {
      const storedChats = await AsyncStorage.getItem("chatList");
      if (!storedChats) return null;

      const chatList = JSON.parse(storedChats);
      const chatItem = chatList.find((chat) => chat.id === userId);

      return chatItem ? chatItem.chatId : null;
    } catch (error) {
      console.error("❌ Lỗi khi lấy chatId từ local:", error);
      return null;
    }
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
      <View style={{ marginHorizontal: 20 }}>
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
            <TouchableOpacity onPress={() => navigation.navigate('Gemini')}>
            <Icon2 name="google-assistant" size={25} color='white' />
            </TouchableOpacity>
            <Icon name="ellipsis-vertical" size={25} color='white' />
          </View>
        </View>
        <View style={styles.inputSearch}>
          <View style={{ marginLeft: '3%' }}>
            <Icon name="search-outline" size={25} color="black" />
          </View>
          <TextInput
            style={styles.search}
            placeholder='Search for a chat...'
            placeholderTextColor={"black"}
            onPress={() => navigation.navigate("Search")}
          />
        </View>



        <FlatList
          data={sortedChats}
          renderItem={({ item }) => (
       
            <Item_home_chat
              data_chat={item}
              onPress={() =>
                handleUserPress(item.id, item.name, item.img, item.chatId, item.lastMessageId)
              }
              onLongPress={() => handleLongPress(item.chatId)} // 🔥 Đảm bảo truyền đúng
              isPinned={pinnedChats.includes(item.chatId)} // 🔥 Truyền trạng thái ghim
              style={[
                styles.chatItem,
                item.isSeen ? styles.readMessage : styles.unreadMessage, // 🔥 Hiển thị giao diện khác nhau cho đã đọc & chưa đọc
              ]}
            >
              {!item.isSeen && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </Item_home_chat>
          )}
          keyExtractor={item => item.chatId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      </View>
      <Modal visible={modalVisible} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      <View style={styles.modalButtons}>
        {/* Nút Ghim/Bỏ ghim */}
        <TouchableOpacity 
          style={styles.modalButton} 
          onPress={() => {
            if (selectedChat) togglePinChat(selectedChat);
          }}
        >
          <Text style={styles.modalButtonText}>
            {selectedChat && pinnedChats.includes(selectedChat) ? "Bỏ ghim" : "Ghim"}
          </Text>
        </TouchableOpacity>

        {/* Nút Hủy */}
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]} 
          onPress={() => setModalVisible(false)}
        >
          <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Làm mờ nền
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%', // Độ rộng modal
    backgroundColor: 'white',
    borderRadius: 15, // Bo góc
    padding: 20,
    alignItems: 'center',
    elevation: 10, // Đổ bóng trên Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#438875',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
  },
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
    width: 50,
    height: 50,
    borderRadius: 60,
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
    marginLeft: 10,
    color: "#FFFFFF",
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
  chatItem: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  unreadMessage: {
    backgroundColor: '#2b2b2b', // Màu nền khi chưa đọc
  },
  readMessage: {
    backgroundColor: '#1a1a1a', // Màu nền khi đã đọc
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
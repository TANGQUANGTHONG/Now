import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Item_home_chat from '../../components/items/Item_home_chat';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase, ref, onValue, get, orderByChild, query, limitToLast } from '@react-native-firebase/database';
import { encryptMessage, decryptMessage, generateSecretKey } from '../../cryption/Encryption';
import { oStackHome } from '../../navigations/HomeNavigation';

const { width, height } = Dimensions.get('window');
const Home = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const chatRef = ref(db, 'chats');

    onValue(chatRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.log("❌ Không có dữ liệu trong 'chats'");
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

        // Lấy tin nhắn mới nhất
        const messagesRef = query(ref(db, `chats/${chatId}/messages`), orderByChild('timestamp'), limitToLast(1));
        const messagesSnapshot = await get(messagesRef);

        let lastMessage = "Chưa có tin nhắn";
        let lastMessageTime = "";
        let lastMessageTimestamp = 0;
        const secretKey = generateSecretKey(otherUserId, currentUserId);
        console.log(`🔑 Secret Key (${currentUserId}_${otherUserId}):`, secretKey);

        if (messagesSnapshot.exists()) {
          const lastMessageData = Object.values(messagesSnapshot.val())[0];
          lastMessage = decryptMessage(lastMessageData.text, secretKey) || "Tin nhắn bị mã hóa";
          lastMessageTime = new Date(lastMessageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          lastMessageTimestamp = lastMessageData.timestamp;
        }

        return {
          chatId,
          id: otherUserId,
          name: decryptedName || "Người dùng",
          img: decryptedImage || "https://example.com/default-avatar.png",
          text: lastMessage,
          time: lastMessageTime,
          timestamp: lastMessageTimestamp,
        };
      });

      const resolvedChats = await Promise.all(chatPromises);
      const filteredChats = resolvedChats.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);

      console.log("📌 Danh sách chat đã sắp xếp:", filteredChats);
      setChatList(filteredChats);
    });
  }, []);

  const safeDecrypt = (encryptedText, userId, myId) => {
    try {
      if (!encryptedText) return "Nội dung trống";

      // Giải mã bằng khóa bí mật của phòng chat
      const decryptedText = decryptMessage(encryptedText, userId, myId);

      // Kiểm tra nếu giải mã thất bại
      if (!decryptedText || decryptedText === "❌ Lỗi giải mã") {
        return "Tin nhắn bị mã hóa";
      }

      return decryptedText;
    } catch (error) {
      console.error("❌ Lỗi giải mã:", error);
      return "Tin nhắn bị mã hóa";
    }
  };


  const handleUserPress = (userId, username, img) => {
    const myId = auth.currentUser?.uid;
    navigation.navigate(oStackHome.Single.name, { userId, myId, username, img });
  };

  return (
    <View style={styles.container}>
      <View style={{ marginHorizontal: 20 }}>
        <View style={styles.boxHeader}>
          <Text style={styles.txtHeader}>Chats</Text>
          <View style={styles.boxIconHeader}>
            <Icon name="chatbox-ellipses-outline" size={25} color='black' />
            <Icon name="list-outline" size={25} color='black' />
          </View>
        </View>
        <View style={styles.inputSearch}>
          <View style={{ marginLeft: '3%' }}>
            <Icon name="search-outline" size={25} color='black' />
          </View>
          <TextInput
            style={styles.search}
            placeholder='Search'
            placeholderTextColor={"#ADB5BD"}
            onPress={() => navigation.navigate("Search")}
          />
        </View>
        <FlatList
          data={chatList}
          renderItem={({ item }) =>
            <Item_home_chat
              data_chat={item}
              onPress={() => handleUserPress(item.id, item.name, item.img)}
            />}
          keyExtractor={item => item.chatId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150, paddingTop: 30 }}
        />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20
  },
  boxIconHeader: {
    flexDirection: 'row',
    gap: 10
  },
  txtHeader: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold'
  },
  inputSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FC',
    padding: 3,
    borderRadius: 10
  },
  search: {
    flex: 1,
    padding: 10
  }
});
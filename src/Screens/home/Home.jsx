import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_home_chat from '../../components/items/Item_home_chat';
import { getAuth } from '@react-native-firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, orderBy, limit 
} from '@react-native-firebase/firestore';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';
import { oStackHome } from '../../navigations/HomeNavigation';

const { width, height } = Dimensions.get('window');
const db = getFirestore();

const Home = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const chatQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUserId)
    );

    const unsubscribeChats = onSnapshot(chatQuery, (chatSnapshot) => {
      const chatData = chatSnapshot.docs.map(doc => ({
        chatId: doc.id,
        users: doc.data().users
      }));

      console.log("🔥 Cập nhật danh sách chat:", chatData);

      const userIds = chatData.map(chat => chat.users.find(userId => userId !== currentUserId));

      if (userIds.length > 0) {
        getUserInfo(userIds).then(usersInfo => {
          // Lắng nghe tin nhắn mới nhất của từng cuộc trò chuyện
          const chatListeners = chatData.map(chat => {
            return onSnapshot(
              query(
                collection(db, "chats", chat.chatId, "messages"),
                orderBy("timestamp", "desc"),
                limit(1)
              ),
              (messageSnapshot) => {
                if (!messageSnapshot.empty) {
                  const lastMessageData = messageSnapshot.docs[0].data();
                  const otherUser = usersInfo.find(user => user.id === chat.users.find(id => id !== currentUserId));
                  if (!otherUser) return;

                  const lastMessage = decryptMessage(lastMessageData.text) || "Tin nhắn bị mã hóa";
                  const lastMessageTime = new Date(lastMessageData.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const lastMessageTimestamp = lastMessageData.timestamp.toMillis();

                  setChatList(prevChats => {
                    const updatedChats = [...prevChats];
                    const chatIndex = updatedChats.findIndex(c => c.chatId === chat.chatId);

                    const chatInfo = {
                      chatId: chat.chatId,
                      id: otherUser.id,
                      name: decryptMessage(otherUser.username) || "Unknown",
                      img: decryptMessage(otherUser.Image) || "https://example.com/default-avatar.png",
                      text: lastMessage,
                      time: lastMessageTime,
                      timestamp: lastMessageTimestamp,
                    };

                    if (chatIndex !== -1) {
                      updatedChats[chatIndex] = chatInfo;
                    } else {
                      updatedChats.push(chatInfo);
                    }

                    return updatedChats.sort((a, b) => b.timestamp - a.timestamp);
                  });
                }
              }
            );
          });

          return () => {
            chatListeners.forEach(unsub => unsub());
          };
        });
      }
    });

    return () => unsubscribeChats();
  }, []);

  const getUserInfo = async (userIds) => {
    try {
      const userPromises = userIds.map(async (userId) => {
        const userDoc = await getDoc(doc(db, "users", userId));
        return userDoc.exists ? { id: userId, ...userDoc.data() } : null;
      });
      const usersInfo = await Promise.all(userPromises);
      return usersInfo.filter(Boolean);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin users:", error);
      return [];
    }
  };

  const handleUserPress = (userId, username, img) => {
    const myId = auth.currentUser?.uid;
    navigation.navigate(oStackHome.Single.name, { userId, myId, username, img });
  };

  return (
    <View style={styles.container}>
      <View style={styles.container_title}>
        <Pressable style={styles.button_search} onPress={() => navigation.navigate('Search')}>
          <Icon name="search" size={22} color="white" />
        </Pressable>
        <Text style={styles.text_title}>Home</Text>
        <Image
          style={styles.img_title}
          source={{ uri: 'https://example.com/default-avatar.png' }}
        />
      </View>
      <View style={styles.container_list_chat}>
        <FlatList
          data={chatList}
          renderItem={({ item }) =>
            <Item_home_chat
              data_chat={item}
              onPress={() => handleUserPress(item.id, item.name, item.img)}
            />}
          keyExtractor={item => item.chatId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text_title: {
    color: 'white',
    fontSize: width * 0.05,
    fontWeight: '500',
  },
  img_title: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
  },
  container_title: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.06,
    marginTop: height * 0.02,
    alignItems: 'center',
  },
  container_list_chat: {
    width: '100%',
    height: height * 1,
    backgroundColor: 'white',
    marginTop: height * 0.03,
    borderTopLeftRadius: width * 0.1,
    borderTopRightRadius: width * 0.1,
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.05,
  },
  button_search: {
    borderWidth: 1,
    borderColor: '#363F3B',
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

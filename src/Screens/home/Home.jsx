import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_home_friend from '../../components/items/Item_home_friend';
import Item_home_chat from '../../components/items/Item_home_chat';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { db } from '../../../FireBaseConfig';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';
const { width, height } = Dimensions.get('window')
const Home = (props) => {
  const { navigation } = props
  const [chatList, setChatList] = useState([]);

  //hàm lấy tất cả các id đã chat với user
  const getUserChats = async () => {
    const currentUserId = auth().currentUser?.uid;
    if (!currentUserId) {
      console.log("Không tìm thấy user hiện tại!");
      return;
    }

    try {
      const chatSnapshot = await firestore()
        .collection("chats")
        .where("users", "array-contains", currentUserId)
        .get();

      const chatIds = chatSnapshot.docs.map((doc) => ({
        id: doc.id,
        users: doc.data().users, // Lấy danh sách user trong từng cuộc chat
      }));

      console.log("Danh sách ID chat của tôi:", chatIds);
      return chatIds;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chat:", error);
    }
  };


  //hàm lấy thông tin user từ userID
  const getUserInfo = async (userIds) => {
    try {
      const userPromises = userIds.map(async (userId) => {
        const userDoc = await firestore().collection("users").doc(userId).get();
        if (userDoc.exists) {
          return { id: userId, ...userDoc.data() };
        }
        return null;
      });

      const usersInfo = await Promise.all(userPromises);
      return usersInfo.filter(Boolean); // Lọc bỏ user null (không tồn tại)
    } catch (error) {
      console.error("Lỗi khi lấy thông tin users:", error);
      return [];
    }
  };




  useEffect(() => {
    const fetchChatUsers = async () => {
      const chats = await getUserChats();
      if (chats) {
        const currentUserId = auth().currentUser?.uid;

        // Lấy danh sách userId của người đã chat với mình
        const chatData = chats.map(chat => {
          const otherUserId = chat.users.find(userId => userId !== currentUserId);
          return { chatId: chat.id, otherUserId };
        });

        console.log("Danh sách chat có user:", chatData);

        const userIds = chatData.map(chat => chat.otherUserId);
        if (userIds.length > 0) {
          const usersInfo = await getUserInfo(userIds);

          // 🔥 Lấy tin nhắn gần nhất từ mỗi cuộc chat
          const chatWithLastMessages = await Promise.all(chatData.map(async (chat) => {
            const encryptedUser = usersInfo.find(user => user.id === chat.otherUserId);
            if (!encryptedUser) return null;

            // 🔍 Truy vấn tin nhắn mới nhất trong cuộc trò chuyện
            const lastMessageSnapshot = await firestore()
              .collection("chats")
              .doc(chat.chatId)
              .collection("messages")
              .orderBy("timestamp", "desc")
              .limit(1)
              .get();

            let lastMessage = "Chưa có tin nhắn";
            let lastMessageTime = "";

            if (!lastMessageSnapshot.empty) {
              const lastMessageData = lastMessageSnapshot.docs[0].data();
              lastMessage = decryptMessage(lastMessageData.text) || "Tin nhắn bị mã hóa";
              lastMessageTime = new Date(lastMessageData.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return {
              chatId: chat.chatId,
              id: encryptedUser.id,
              name: decryptMessage(encryptedUser.username) || "Unknown",
              img: decryptMessage(encryptedUser.Image) || "https://example.com/default-avatar.png",
              text: lastMessage, // Nội dung tin nhắn gần nhất
              time: lastMessageTime, // Thời gian tin nhắn
            };
          }));

          const chatListData = chatWithLastMessages.filter(Boolean); // Loại bỏ phần tử null

          console.log("Danh sách chat list hiển thị:", chatListData);
          setChatList(chatListData); // Cập nhật danh sách chat
        }
      }
    };

    fetchChatUsers();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.container_title}>
        <Pressable style={styles.button_search} onPress={() => navigation.navigate('Search')}>
          <Icon name="search" size={22} color="white" />
        </Pressable>

        <Text style={styles.text_title}>Home</Text>
        <Image
          style={styles.img_title}
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
          }}
        />
      </View>
      <View style={styles.container_list_chat}>
        <FlatList
          data={chatList}
          renderItem={({ item }) =>
            <Item_home_chat
              data_chat={item}
              onPress={() => navigation.navigate("Single", { chatId: item.chatId, otherUser: item })}
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
  container_list_friend: {
    marginLeft: width * 0.06,
    marginTop: height * 0.05,
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
import { useNavigation, useRoute,   } from '@react-navigation/native';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebaseConfig';
import { oStackHome } from '../../navigations/HomeNavigation';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Text, TouchableOpacity, View, Dimensions, StyleSheet
 } from 'react-native';
 import { getAuth } from "firebase/auth";
const { width, height } = Dimensions.get('window');


const ProfileView = () => {
  const route = useRoute();
  const { userId } = route.params; // ID của người nhận
  const [user, setUser] = useState(null);
  const db = getFirestore(app);
  const navigation = useNavigation();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const saveChatId = async (chatId) => {
    try {
      await AsyncStorage.setItem('chatId', chatId);
    } catch (error) {
      console.error("❌ Lỗi khi lưu chatId:", error);
    }
  };

if (!currentUser) {
  console.error("🔴 Lỗi: Người dùng chưa đăng nhập!");
  return;
}

const currentUserId = currentUser.uid;
console.log("🟢 currentUserId:", currentUserId);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data());
        } else {
          console.log('Không tìm thấy người dùng');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };
    fetchUser();
  }, [userId]);

  const startChat = async () => {
    if (!userId || !currentUserId) return;
  
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", currentUserId));
  
    try {
      const querySnapshot = await getDocs(q);
      let chatId = null;
  
      querySnapshot.forEach((docSnap) => {
        const chatData = docSnap.data();
        if (chatData.users.includes(userId)) {
          chatId = docSnap.id;
        }
      });
  
      if (!chatId) {
        const newChatRef = await addDoc(chatsRef, {
          users: [currentUserId, userId],
          createdAt: new Date(),
          messages: [],
        });
  
        chatId = newChatRef.id;
      }
  
      // Lưu chatId vào AsyncStorage
      await saveChatId(chatId);
  
      // Chuyển sang màn hình chat
      navigation.navigate(oStackHome.Single.name, { chatId, userId });
  
    } catch (error) {
      console.error("❌ Lỗi khi tạo chat:", error);
    }
  };
  

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <TouchableOpacity style={styles.button} onPress={startChat}>
        <Text style={styles.buttonText}>Nhắn Tin</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
      paddingHorizontal: width * 0.05,
    },
    avatar: {
      width: width * 0.35,
      height: width * 0.35,
      borderRadius: width * 0.175,
      marginBottom: height * 0.02,
      borderWidth: 2,
      borderColor: '#007AFF',
    },
    name: {
      fontSize: width * 0.05,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: height * 0.02,
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: height * 0.015,
      paddingHorizontal: width * 0.1,
      borderRadius: 8,
      elevation: 3, // Hiệu ứng đổ bóng
    },
    buttonText: {
      color: 'white',
      fontSize: width * 0.045,
      fontWeight: 'bold',
    },
  });
  

export default ProfileView;

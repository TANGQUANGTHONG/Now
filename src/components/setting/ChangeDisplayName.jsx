import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useNavigation} from '@react-navigation/native';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
import {getAuth} from '@react-native-firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  update,
} from '@react-native-firebase/database';

const ChangeUserInfo = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [myUser, setMyUser] = useState(null);

  useEffect(() => {
    const fetchUser = () => {
      const id = auth.currentUser?.uid;
      if (!id) return;

      const userRef = ref(getDatabase(), `users/${id}`);
      onValue(userRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const decryptedName = data.name
            ? decryptMessage(data.name)
            : 'Không có tên';
          let decryptedNickname = data.nickname
            ? decryptMessage(data.nickname)
            : '';

          // Thêm @ vào trước nickname nếu chưa có
          if (decryptedNickname && !decryptedNickname.startsWith('@')) {
            decryptedNickname = `@${decryptedNickname}`;
          }

          setMyUser({
            id: id,
            name: decryptedName,
            nickname: decryptedNickname,
          });

          setName(decryptedName);
          setNickname(decryptedNickname);
        }
      });
    };

    fetchUser();
  }, []);

  const handleUpdateUsername = async () => {
    if (!name.trim() || !nickname.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ!');
      return;
    }
  
    try {
      const id = auth.currentUser?.uid;
      if (!id) {
        Alert.alert('Lỗi', 'Không tìm thấy ID người dùng!');
        return;
      }
  
      let formattedNickname = nickname.startsWith('@') ? nickname.substring(1) : nickname;
  
      const db = getDatabase();
      const usersRef = ref(db, 'users');
  
      // Kiểm tra nickname có bị trùng không
      onValue(usersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const users = snapshot.val();
          const isDuplicate = Object.keys(users).some((userId) => {
            const existingNickname = users[userId].nickname ? decryptMessage(users[userId].nickname) : null;
          
            return userId !== id && existingNickname && existingNickname === formattedNickname;
          });
          
          if (isDuplicate) {
            Alert.alert('Lỗi', 'Biệt danh đã tồn tại, vui lòng chọn biệt danh khác!');
            return;
          }
  
          // Nếu nickname không trùng thì cập nhật thông tin
          const userRef = ref(db, `users/${id}`);
          await update(userRef, { name: encryptMessage(name) });
          await update(userRef, { nickname: encryptMessage(formattedNickname) });
  
          Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
          navigation.goBack();
        }
      }, { onlyOnce: true }); // Chỉ lấy dữ liệu một lần, tránh re-render không cần thiết
  
    } catch (error) {
      Alert.alert('Lỗi', error.message);
      console.log('Lỗi cập nhật name:', error);
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.containerHearder}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon
            style={styles.iconBack}
            name="angle-left"
            size={30}
            color="black"
          />
        </Pressable>
        <TouchableOpacity onPress={handleUpdateUsername}>
          <Text style={styles.text_hearder}>Xong</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Thay đổi tên</Text>
      <TextInput
        placeholder="Nhập tên mới"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Đặt biệt danh</Text>
      <TextInput
        placeholder="@Nhập biệt danh mới"
        style={styles.input}
        value={nickname}
        onChangeText={text => {
          if (!text.startsWith('@')) {
            setNickname(`@${text}`); // Đảm bảo luôn có @ phía trước
          } else {
            setNickname(text);
          }
        }}
      />

      {/* <TouchableOpacity style={styles.button} onPress={handleUpdateUsername}>
        <Text style={styles.buttonText}>xác nhận</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: 'white'},
  iconBack: {marginBottom: 20},
  label: {fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#24786D',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {color: '#fff', fontSize: 16},
  containerHearder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text_hearder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24786D',
  },
});

export default ChangeUserInfo;

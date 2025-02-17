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
import {
  getFirestore,
  doc,
  getDocs,
  updateDoc,
  collection,
} from '@react-native-firebase/firestore';

import {getAuth} from '@react-native-firebase/auth';

const ChangeUserInfo = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [myUser, setmyUser] = useState([]);

  const fetchUsers = async () => {
    try {
      const firestore = getFirestore(); // Lấy instance Firestore
      const querySnapshot = await getDocs(collection(firestore, 'users')); // Lấy danh sách user

      const userList = querySnapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          username: data.username
            ? decryptMessage(data.username)
            : 'Không có tên',
          email: data.email ? decryptMessage(data.email) : 'Không có email',
          img: data.Image ? decryptMessage(data.Image) : null,
        };
      });

      console.log(userList);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const myId = auth.currentUser?.uid;
  const filtered = users.filter(user => user.id === myId);
  console.log(filtered);
  // Cập nhật Username trong Firestore
  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mới!');
      return;
    }
    try {
      const id = auth.currentUser?.uid;
      if (!id) {
        Alert.alert('Lỗi', 'Không tìm thấy ID người dùng!');
        return;
      }

      const userRef = doc(getFirestore(), 'users', id);
      await updateDoc(userRef, {username: encryptMessage(username)});

      Alert.alert('Thành công', 'Tên đã được cập nhật!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
      console.log('Lỗi cập nhật username:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()}>
        <Icon
          style={styles.iconBack}
          name="angle-left"
          size={30}
          color="black"
        />
      </Pressable>

      {/* Cập nhật Username */}
      <Text style={styles.label}>Thay đổi tên</Text>
      <TextInput
        placeholder="Nhập tên mới"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdateUsername}>
        <Text style={styles.buttonText}>Đổi tên</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: 'white'},
  iconBack: {marginBottom: 20},
  label: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
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
});

export default ChangeUserInfo;

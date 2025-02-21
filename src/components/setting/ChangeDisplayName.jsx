import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase, ref, onValue, update } from '@react-native-firebase/database';

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
          const decryptedName = data.name ? decryptMessage(data.name) : 'Không có tên';
          let decryptedNickname = data.nickname ? decryptMessage(data.nickname) : '';

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
      let formattedNickname = nickname;
      if (formattedNickname.startsWith('@')) {
        formattedNickname = formattedNickname.substring(1); // Bỏ @ trước khi lưu
      }

      const userRef = ref(getDatabase(), `users/${id}`);
      await update(userRef, { name: encryptMessage(name) });
      await update(userRef, { nickname: encryptMessage(formattedNickname) });
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('Lỗi', error.message);
      console.log('Lỗi cập nhật name:', error);
    }
  };


  return (
    <View style={styles.container}>
      <View style = {styles.containerHearder}>
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
        onChangeText={(text) => {
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
    container: {
      flex: 1,
      backgroundColor: 'white',
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    containerHearder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    iconBack: {
      padding: 10,
    },
    text_hearder: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#24786D',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: 'black',
      marginBottom: 5,
    },
    input: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 10,
      marginBottom: 15,
      fontSize: 16,
      color: 'black',
    },
  
});

export default ChangeUserInfo;

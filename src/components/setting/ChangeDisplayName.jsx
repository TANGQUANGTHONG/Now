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
import LoadingModal from '../../loading/LoadingModal';
import LottieView from 'lottie-react-native';

const ChangeUserInfo = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [myUser, setMyUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    const fetchUser = () => {
      setLoading(true); // Bật loading khi bắt đầu lấy dữ liệu
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
        setLoading(false); // Tắt loading sau khi lấy dữ liệu
      }, { onlyOnce: true });
    };
  
    fetchUser();
  }, []);
  

  const handleUpdateUsername = async () => {
    if (!name.trim() || !nickname.trim()) {
      Alert.alert('Error', 'Please enter all required information!');
      return;
    }
  
    try {
      setUpdating(true); // Bật loading khi bắt đầu cập nhật
      const id = auth.currentUser?.uid;
      if (!id) {
        Alert.alert('Error', 'User ID not found!');

        return;
      }
  
      let formattedNickname = nickname.startsWith('@') ? nickname.substring(1) : nickname;
  
      const db = getDatabase();
      const usersRef = ref(db, 'users');
  
      onValue(usersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const users = snapshot.val();
          const isDuplicate = Object.keys(users).some((userId) => {
            const existingNickname = users[userId].nickname ? decryptMessage(users[userId].nickname) : null;
            return userId !== id && existingNickname && existingNickname === formattedNickname;
          });
  
          if (isDuplicate) {
            Alert.alert('Error', 'Nickname already exists, please choose another one!');
            setUpdating(false); // Tắt loading nếu lỗi
            return;
          }
  
          const userRef = ref(db, `users/${id}`);
          await update(userRef, { name: encryptMessage(name) });
          await update(userRef, { nickname: encryptMessage(formattedNickname) });
  
          setUpdating(false);
          navigation.goBack();
        }
      }, { onlyOnce: true });
  
    } catch (error) {
      Alert.alert('Error', error.message);
      console.log('Lỗi cập nhật name:', error);
      setUpdating(false);
    }
  };
  
  

  return (
    <View style={styles.container}>
    {loading ? (
      <LottieView
        source={require('../../loading/loading3.json')}
        autoPlay
        loop
        style={styles.loadingAnimation}
      />
    ) : (
      <>
        <View style={styles.containerHearder}>
          <Pressable onPress={() => navigation.goBack()}>
            <Icon
              style={styles.iconBack}
              name="angle-left"
              size={30}
              color="black"
            />
          </Pressable>
          <TouchableOpacity onPress={handleUpdateUsername} disabled={updating}>
            {updating ? (
              <LottieView
                source={require('../../loading/loading3.json')}
                autoPlay
                loop
                style={styles.updateLoading}
              />
            ) : (
              <Text style={styles.text_header}>Done</Text>
            )}
            </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Change Name</Text>
            <TextInput
              placeholder="Enter new name"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={'#aaa'}
            />
            
            <Text style={styles.label}>Set Nickname</Text>            
        <TextInput
          placeholder="@Nhập biệt danh mới"
          style={styles.input}
          value={nickname}
          onChangeText={text => {
            if (!text.startsWith('@')) {
              setNickname(`@${text}`);
            } else {
              setNickname(text);
            }
          }}
          placeholderTextColor={'#aaa'}
        />
      </>
    )}
  </View>
  
  );
};

const styles = StyleSheet.create({
  loadingAnimation: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  updateLoading: {
    width: 30,
    height: 30,
  },
  
  container: {flex: 1, padding: 20, backgroundColor: 'white'},
  iconBack: {marginBottom: 20},
  label: {fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    color: 'black',
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

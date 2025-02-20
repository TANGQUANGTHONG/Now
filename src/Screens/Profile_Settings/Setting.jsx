import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
import {getAuth} from '@react-native-firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  update,
} from '@react-native-firebase/database';

const {width, height} = Dimensions.get('window');

const Setting = props => {
  const {navigation} = props;
  const auth = getAuth();
  const [myUser, setMyUser] = useState(null);

  const logOut = () => {
    auth.signOut().then(() => {
      console.log('Đã đăng xuất');
    });
  };

  const Next_ChangeDisplayName = () => {
    navigation.navigate('ChangeDisplayName');
  };
  const Next_ChangeDisplayPass = () => {
    navigation.navigate('ChangePasswordScreen');
  };
  const Next_ChangeDisplayDelete = () => {
    navigation.navigate('DeleteAccountScreen');
  };
  useEffect(() => {
    const fetchUser = () => {
      const id = auth.currentUser?.uid;
      if (!id) return;

      const userRef = ref(getDatabase(), `users/${id}`);
      onValue(userRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setMyUser({
            id: id,
            name: data.name ? decryptMessage(data.name) : 'Không có tên',
            email: data.email ? decryptMessage(data.email) : 'Không có email',
            nickname: data.nickname
              ? decryptMessage(data.nickname)
              : 'Không có nickname',
            img: data.Image
              ? decryptMessage(data.Image)
              : 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
          });
        }
      });
    };

    fetchUser();
  }, []);
  console.log(myUser);

  // xóa tài khoản
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');

      // Xác thực lại người dùng
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        password,
      );
      await user.reauthenticateWithCredential(credential);

      // Xóa dữ liệu trong Realtime Database
      await database().ref(`/users/${user.uid}`).remove();

      // Xóa tài khoản
      await user.delete();

      Alert.alert('Thành công', 'Tài khoản và dữ liệu đã bị xóa.');

      // Đóng modal
      setModalVisible(false);

      // Điều hướng về màn hình đăng nhập (tuỳ vào ứng dụng của bạn)
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.textSetting}>Setting</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.rectangle}>
          <View style={styles.rectangleLine}></View>
        </View>
        <View style={styles.profile}>
          <Pressable>
            <Image
              source={{
                uri: myUser?.img
                  ? myUser.img
                  : 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
              }}
              style={styles.avatar}
            />
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{myUser?.name}</Text>
            <Text style={styles.status}>
              <Text>@</Text>
              {myUser?.nickname}
            </Text>
          </View>
          <Icon name="qr-code-outline" size={22} color="black" />
        </View>

        <ScrollView style={styles.list}>
          <TouchableOpacity onPress={Next_ChangeDisplayName}>
            <Option
              icon="person"
              title="Change user name"
              subtitle="Privacy, security, change number"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={Next_ChangeDisplayPass}>
            <Option
              icon="chatbubble-ellipses-outline"
              title="Change password"
              subtitle="Chat history, theme, wallpapers"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={Next_ChangeDisplayDelete}>
            <TouchableOpacity onPress={() => setModalVisible(true)} >
              <Option
                icon="notifications"
                title="Delete account"
                subtitle="Messages, group and others"
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity onPress={logOut}>
            <Option1 icon="exit-outline" title="Log out" />
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View
            style={{
              width: 300,
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
            }}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
              Nhập mật khẩu
            </Text>

            <TextInput
              placeholder="Nhập mật khẩu để xác nhận"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{borderBottomWidth: 0.5, marginBottom: 20}}
            />

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{padding: 10}}>
                <Text style={{color: 'blue'}}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{padding: 10}}>
                <Text style={{color: 'red'}}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Option = ({icon, title, subtitle}) => (
  <View style={styles.option}>
    <View style={[styles.optionIcon]}>
      <Icon name={icon} size={20} color="#555" />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);
const Option1 = ({icon, title, subtitle}) => (
  <View style={styles.option}>
    <View style={[styles.optionIcon]}>
      <Icon name={icon} size={20} color="red" />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle1}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002DE3',
  },
  header: {
    alignItems: 'center',
    padding: height * 0.06,
    backgroundColor: '#002DE3',
  },
  body: {
    backgroundColor: '#fff',
    padding: width * 0.05,
    borderTopLeftRadius: width * 0.1,
    borderTopRightRadius: width * 0.1,
    flex: 1,
  },
  textSetting: {
    fontSize: width * 0.05,
    fontWeight: '500',
    color: '#fff',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.03,
    backgroundColor: 'white',
    marginVertical: height * 0.01,
    borderRadius: width * 0.03,
  },
  optionIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: width * 0.04,
  },
  optionTitle: {
    color: 'black',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  optionTitle1: {
    color: 'red',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  optionSubtitle: {
    color: 'gray',
    fontSize: width * 0.03,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomLeftRadius: width * 0.05,
    borderBottomRightRadius: width * 0.05,
    padding: width * 0.03,
    marginVertical: height * 0.02,
  },
  avatar: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
  },
  profileInfo: {
    flex: 1,
    marginLeft: width * 0.04,
  },
  name: {
    color: 'black',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  status: {
    color: 'gray',
    fontSize: width * 0.035,
  },
});

export default Setting;

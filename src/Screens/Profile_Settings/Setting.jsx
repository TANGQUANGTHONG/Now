import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  getCurrentUserFromStorage,
  removeCurrentUserFromStorage,
} from '../../storage/Storage';
import QRCode from 'react-native-qrcode-svg'; // ✅ Import thư viện QR Code
import {oStackHome} from '../../navigations/HomeNavigation';

const {width, height} = Dimensions.get('window');

const Setting = ({navigation}) => {
  const [myUser, setMyUser] = useState(null);
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false); // 🔥 State để hiển thị modal QR
  GoogleSignin.configure({
    webClientId:
      '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

  // useEffect(() => {
  //   const fetchUser = async ()=>{
  //     const userData = await getCurrentUserFromStorage();
  //     if(userData){
  //       setMyUser(userData)
  //     }
  //   }
  //   fetchUser();
  // }, [])

  useEffect(() => {
    const fetchUser = () => {
      const id = auth().currentUser?.uid;
      if (!id) return;

      const userRef = database().ref(`users/${id}`);
      userRef.on('value', snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          let decryptedNickname = data.nickname
            ? decryptMessage(data.nickname)
            : 'Không có nickname';

          // Thêm @ vào trước nickname nếu chưa có
          if (decryptedNickname && !decryptedNickname.startsWith('@')) {
            decryptedNickname = `@${decryptedNickname}`;
          }

          setMyUser({
            id: id,
            name: data.name ? decryptMessage(data.name) : 'Không có tên',
            email: data.email ? decryptMessage(data.email) : 'Không có email',
            nickname: decryptedNickname,
            img: data.Image
              ? decryptMessage(data.Image)
              : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7xcDbUE0eJvCkvvGNoKQrTfMI4Far-8n7pHQbbTCkV9uVWN2AJ8X6juVovcORp0S04XA&usqp=CAU',
          });
        }
      });

      return () => userRef.off();
    };

    fetchUser();
  }, []);

  const logOut = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      removeCurrentUserFromStorage();
      console.log('Đã đăng xuất khỏi Google và Firebase.');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu.');
      return;
    }
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');

      const credential = auth.EmailAuthProvider.credential(
        user.email,
        password,
      );
      await user.reauthenticateWithCredential(credential);
      await database().ref(`/users/${user.uid}`).remove();
      await user.delete();

      Alert.alert('Thành công', 'Tài khoản và dữ liệu đã bị xóa.');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
      console.log(error.message);
    }
  };

  return (
    <View style={styles.container}>
      {!myUser ? (
        <Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>
          Đang tải...
        </Text>
      ) : (
        <>
          <View style={styles.header}>
            {/* <Text style={styles.textSetting}>Setting</Text> */}

            <MaskedView
              maskElement={
                <Text
                  style={[
                    styles.textSetting,
                    {backgroundColor: 'transparent', color: '#99F2C8'},
                  ]}>
                  Setting
                </Text>
              }>
              <LinearGradient
                colors={['#438875', '#99F2C8']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {/* Invisible text to preserve spacing */}
                <Text style={[styles.textSetting, {opacity: 0}]}>Setting</Text>
              </LinearGradient>
            </MaskedView>
          </View>
          <View style={styles.body}>
            <View style={styles.profile}>
              <Pressable>
                <Image
                  source={
                    myUser?.img
                      ? {uri: myUser.img}
                      : require('../../../assest/images/avatar_default.png')
                  }
                  style={styles.avatar}
                />
              </Pressable>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{myUser?.name}</Text>
                <Text style={styles.status}>{myUser?.nickname}</Text>
              </View>
              <TouchableOpacity onPress={() => setQrVisible(true)}>
                <Icon name="qr-code-outline" size={30} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('NearbyFriends', {userId: myUser.id})
                }>
                <Icon name="location-outline" size={30} color="black" />
              </TouchableOpacity>
            </View>

            {/* 🔥 Modal hiển thị QR Code */}
            <Modal
              visible={qrVisible}
              transparent
              onRequestClose={() => setQrVisible(false)}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Mã QR của bạn</Text>
                  <QRCode
                    value={`chatapp://chat/${
                      myUser.id
                    }?username=${encodeURIComponent(
                      myUser.name,
                    )}&img=${encodeURIComponent(myUser.img)}`}
                    size={200}
                  />
                  <TouchableOpacity
                    onPress={() => setQrVisible(false)}
                    style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <ScrollView style={styles.list}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ChangeDisplayName')}>
                <Option
                  icon="person"
                  title="Change user name"
                  subtitle="Privacy, security, change number"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePasswordScreen')}>
                <Option
                  icon="lock-closed"
                  title="Change password"
                  subtitle="Update your password"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Option
                  icon="trash"
                  title="Delete account"
                  subtitle="Remove account permanently"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={logOut}>
                <Option
                  icon="exit-outline"
                  title="Log out"
                  subtitle="Sign out from your account"
                  color="red"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(oStackHome.QRScannerScreen.name)
                }>
                <Option icon="scan" title="QR" subtitle="QR scan" color="red" />
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
                <Text
                  style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
                  Nhập mật khẩu
                </Text>

                <TextInput
                  placeholder="Nhập mật khẩu để xác nhận"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={{borderBottomWidth: 1, marginBottom: 20}}
                />

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
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
        </>
      )}
    </View>
  );
};

const Option = ({icon, title, subtitle, color = 'black'}) => (
  <View style={styles.option}>
    <Icon name={icon} size={20} color={color} />
    <View style={styles.optionText}>
      <Text style={[styles.optionTitle, {color}]}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    alignItems: 'center',
    padding: height * 0.06,
    backgroundColor: 'black',
  },
  body: {
    backgroundColor: '#fff',
    padding: width * 0.05,
    borderTopLeftRadius: width * 0.1,
    borderTopRightRadius: width * 0.1,
    flex: 1,
  },
  textSetting: {
    fontSize: width * 0.1,
    fontWeight: 'bold',
    // color: '#fff',
    fontStyle: 'italic',
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
  profile: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  avatar: {width: 60, height: 60, borderRadius: 30, marginRight: 10},
  profileInfo: {flex: 1},
  name: {fontSize: 18, fontWeight: 'bold', color: 'black'},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  closeButtonText: {color: 'white', fontSize: 16},
});

export default Setting;

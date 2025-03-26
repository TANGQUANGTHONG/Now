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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
import {launchImageLibrary} from 'react-native-image-picker';
import {getAuth} from '@react-native-firebase/auth';
import {getDatabase, ref, update} from '@react-native-firebase/database';
import LoadingModal from '../../loading/LoadingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserNavigation from '../../navigations/UserNavigation';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dzlomqxnn/upload'; // URL của Cloudinary để upload ảnh
const CLOUDINARY_PRESET = 'ml_default'; // Preset của Cloudinary cho việc upload ảnh

const {width, height} = Dimensions.get('window');

const Setting = ({navigation}) => {
  const [myUser, setMyUser] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false); // 🔥 State để hiển thị modal QR
  const providerId = auth().currentUser?.providerData[0]?.providerId;
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
    });
  }, []);
  // đổi avatar
  const updateAvatar = async avatarUrl => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        Alert.alert('Error', 'User ID not found!');
        return;
      }

      const userRef = ref(getDatabase(), `users/${userId}`);
      await update(userRef, {Image: encryptMessage(avatarUrl)});
    } catch (error) {
      Alert.alert('Error', error.message);
      console.log('Lỗi cập nhật avatar:', error);
    }
  };

  // lấy ảnh từ thư viện
  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Lỗi', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        uploadImageToCloudinary(imageUri);
      }
    });
  };

  const uploadImageToCloudinary = async imageUri => {
    try {
      setloading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        console.log('✅ Ảnh đã tải lên Cloudinary:', data.secure_url);
        updateAvatar(data.secure_url);
      } else {
        throw new Error('Lỗi khi tải ảnh lên Cloudinary');
      }
    } catch (error) {
      console.error('❌ Lỗi khi upload ảnh:', error);
    } finally {
      setloading(false);
    }
  };

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
            : 'No nickname';


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
      const currentUser = auth().currentUser;
      const userId = currentUser?.uid;

      // Cập nhật trạng thái offline trước khi đăng xuất
      if (userId) {
        await database().ref(`/users/${userId}`).update({
          isOnline: false,
          lastActive: database.ServerValue.TIMESTAMP,
        });
        console.log(`User ${userId} is now offline`);
      }

      // Đăng xuất khỏi Google và Firebase
      await GoogleSignin.signOut();
      await auth().signOut();

      removeCurrentUserFromStorage();
      console.log('Đã đăng xuất khỏi Google và Firebase.');
      navigation.reset({
        index: 0,
        routes: [{name: 'UserNavigation'}],
      });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('You are not logged in.');

      const providerId = user.providerData[0]?.providerId;
      console.log('Provider ID:', providerId);

      // Reauthenticate identity
      if (providerId === 'password') {
        if (!password) {
          Alert.alert('Error', 'Please enter your password to confirm.');
          return;
        }
        const credential = auth.EmailAuthProvider.credential(
          user.email,
          password,
        );
        await user.reauthenticateWithCredential(credential);
        console.log('Successfully reauthenticated with password.');
      } else if (providerId === 'google.com') {
        await GoogleSignin.hasPlayServices();
        console.log('Google Play Services sẵn sàng.');

        const userInfo = await GoogleSignin.signIn();
        console.log('Google Sign-In Result:', userInfo);

        const idToken = userInfo.data?.idToken || userInfo.idToken;
        if (!idToken) throw new Error('Không lấy được idToken từ Google.');
        console.log('idToken:', idToken);

        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await user.reauthenticateWithCredential(googleCredential);
        console.log('Xác thực lại thành công với Google.');
      }

      // Gửi email xác minh
      await user.sendEmailVerification();
      Alert.alert(
        'Email Verification',
        'Please check your email and click the verification link. The account will be automatically deleted after verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false); // Đóng modal
              // Bắt đầu kiểm tra định kỳ
              const checkVerification = setInterval(async () => {
                try {
                  await user.reload(); // Cập nhật trạng thái người dùng
                  console.log('Email verified status:', user.emailVerified);
                  if (user.emailVerified) {
                    clearInterval(checkVerification); // Dừng kiểm tra
                    // Xóa tài khoản
                    await database().ref(`/users/${user.uid}`).remove(); // Xóa dữ liệu trong Realtime Database
                    await AsyncStorage.clear(); // Xóa dữ liệu trong AsyncStorage
                    await user.delete(); // Xóa tài khoản Firebase
                    console.log('The account has been automatically deleted.');
                    Alert.alert(
                      'Success',
                      'The account and data have been deleted.',
                    );
                    // Chuyển hướng về màn hình đăng nhập
                    navigation.reset({
                      index: 0,
                      routes: [{name: 'Login'}],
                    });
                  }
                } catch (error) {
                  clearInterval(checkVerification); // Dừng kiểm tra nếu có lỗi
                  console.error('Error during verification check:', error);
                  Alert.alert(
                    'Error',
                    'An error occurred while deleting the account.',
                  );
                }
              }, 2000); // Kiểm tra mỗi 2 giây

              // (Tùy chọn) Dừng kiểm tra sau 5 phút nếu không xác minh
              setTimeout(() => {
                clearInterval(checkVerification);
                Alert.alert(
                  'Timeout',
                  'Please try again if you still want to delete your account.',
                );
              }, 300000); // 300,000 ms = 5 phút
            },
          },
        ],
      );
    } catch (error) {
      console.error('Lỗi xóa tài khoản:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingModal visible={loading} />
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
              <Pressable onPress={pickImage}>
                <Image
                  source={
                    myUser?.img
                      ? {uri: myUser.img}
                      : require('../../../assest/images/avatar_default.png')
                  }
                  style={styles.avatar}
                />

                <View
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 0,
                    backgroundColor: 'white',
                    borderRadius: 15,
                    padding: 2,
                    borderWidth: 1,
                    borderColor: 'gray',
                  }}>
                  <Icon name="camera-reverse" size={18} color="black" />
                </View>
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
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(oStackHome.QRScannerScreen.name)
                }>
                <Option icon="scan" title="QR" subtitle="QR scan" />
              </TouchableOpacity>
              <TouchableOpacity onPress={logOut}>
                <Option
                  icon="exit-outline"
                  title="Log out"
                  subtitle="Sign out from your account"
                  color="red"
                />
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
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    color: 'black',
                  }}>
                  Confirm account deletion
                </Text>
                <Text style={{color: 'black', marginBottom: 10}}>
                  {providerId === 'password'
                    ? 'Please enter your password to confirm.'
                    : 'You will need to log in again via Google to verify.'}
                </Text>

                {providerId === 'password' && (
                  <TextInput
                    placeholder="Nhập mật khẩu để xác nhận"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={'#aaa'}
                    style={{borderBottomWidth: 1, marginBottom: 20}}
                  />
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={{padding: 10}}>
                    <Text style={{color: 'blue'}}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={{padding: 10}}>
                    <Text style={{color: 'red'}}>Confirm</Text>
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
  status: {
    color: 'black',
  },
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

import { StyleSheet, Text, View, Image, TouchableOpacity, Pressable, Dimensions, Modal, TextInput } from 'react-native';
import React, { useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
const { width, height } = Dimensions.get('window');
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { encryptMessage } from '../../cryption/Encryption';
import { saveCurrentUserAsyncStorage, saveChatsAsyncStorage } from '../../storage/Storage';
import LoadingModal from '../../loading/LoadingModal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Thêm thư viện icon

const Boarding = (props) => {
  const { navigation } = props;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [idToken, setIdToken] = useState('');
  const [nickname, setNickname] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  GoogleSignin.configure({
    webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

  // Hàm loại bỏ dấu tiếng Việt và chuyển thành chữ thường
  const removeVietnameseDiacritics = (str) => {
    str = str.toLowerCase();
    str = str
      .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
      .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
      .replace(/[ìíỉĩị]/g, 'i')
      .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
      .replace(/[ùúủũụưừứửữự]/g, 'u')
      .replace(/[ỳýỷỹỵ]/g, 'y')
      .replace(/đ/g, 'd');
    return str;
  };

  const generateRandomNickname = (userName) => {
    const baseName = removeVietnameseDiacritics(userName).replace(/\s+/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    const separator = Math.random() > 0.5 ? '.' : '_';
    let nickname = `${baseName}${separator}${randomNum}`;
    return nickname.length > 20 ? nickname.substring(0, 20) : nickname;
  };

  async function signInWithGoogle() {
    try {
      setLoading(true);
      await GoogleSignin.signOut();

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      const idToken = signInResult.idToken || signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token found');
      }

      const name = signInResult.data.user.name;
      const avatar = signInResult.data.user.photo;
      const email = signInResult.data.user.email;

      console.log('User email:', email);
      console.log('User Name:', name);
      console.log('User Photo:', avatar);

      setName(name);
      setEmail(email);
      setAvatar(avatar);
      setIdToken(idToken);

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const userId = userCredential.user.uid;

      const userRef = database().ref(`/users/${userId}`);
      const snapshot = await userRef.once('value');

      if (!snapshot.exists()) {
        const userData = {
          name: encryptMessage(name),
          email: encryptMessage(email),
          Image: encryptMessage(avatar),
          isCompleteNickname: false,
          countChat: 100,
          createdAt: database.ServerValue.TIMESTAMP,
        };
        await userRef.set(userData);
        console.log('New user created with data:', userData);
      } else {
        const userData = snapshot.val();
        const updates = {};

        if (!userData.name) updates.name = encryptMessage(name);
        if (!userData.email) updates.email = encryptMessage(email);
        if (!userData.Image) updates.Image = encryptMessage(avatar);
        if (!userData.createdAt) updates.createdAt = database.ServerValue.TIMESTAMP;

        if (Object.keys(updates).length > 0) {
          await userRef.update(updates);
          console.log('Updated missing fields:', updates);
        }
      }

      await saveCurrentUserAsyncStorage();
      await saveChatsAsyncStorage();

      const userData = snapshot.exists() ? snapshot.val() : { isCompleteNickname: false };
      if (!userData.isCompleteNickname) {
        const randomNickname = generateRandomNickname(name);
        setSuggestedNickname(randomNickname);
        setNickname(randomNickname);
        setShowNicknameModal(true);
      } else {
        console.log('User already has a nickname, proceeding to home.');
        navigation.navigate('HomeNavigation');
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      alert('Lỗi đăng nhập: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleNicknameSubmit = async () => {
    if (nickname.length > 20) {
      alert('Nickname tối đa 20 ký tự!');
      return;
    }
    if (!nickname) {
      alert('Vui lòng nhập nickname!');
      return;
    }

    const processedNickname = removeVietnameseDiacritics(nickname);
    const encryptedNickname = encryptMessage(processedNickname);

    try {
      setLoading(true);

      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const userRef = database().ref(`/users/${userId}`);
      await userRef.update({
        nickname: encryptedNickname,
        isCompleteNickname: true,
      });

      console.log('Nickname saved to Realtime Database:', encryptedNickname);
      setShowNicknameModal(false);

      navigation.navigate('HomeNavigation');
    } catch (error) {
      console.log('Error saving nickname:', error);
      alert('Lỗi khi lưu nickname: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi nhấn icon random nickname
  const handleRandomNickname = () => {
    const newNickname = generateRandomNickname(name);
    setNickname(newNickname);
    setSuggestedNickname(newNickname); // Cập nhật gợi ý hiển thị
  };

  return (
    <View style={styles.container}>
      <LoadingModal visible={loading} />
      <Image
        style={styles.image1}
        source={require('../auth/assets/background/Illustration.png')}
      />

      <View style={styles.viewBoarding}>
        <View style={styles.desContainer}>
          <MaskedView
            maskElement={
              <Text style={[{ backgroundColor: 'transparent', fontWeight: 'bold', color: '#FFF', fontSize: width * 0.045, marginVertical: width * -0.01 }]}>
                DeepChat
              </Text>
            }
          >
            <LinearGradient
              colors={['#438875', '#99F2C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.deepChatText, { opacity: 0 }]}>DeepChat</Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.textHeader}>
            is a secure messaging app with end-to-end encryption, real-time chats. It ensures privacy with self-destructing messages and customizable security settings.
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <TouchableOpacity onPress={signInWithGoogle}>
              <Image
                style={styles.icon}
                source={require('../auth/assets/icon/icon_google.png')}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.btnContainer}>
          <LinearGradient
            colors={['#438875', '#99F2C8']}
            style={styles.signUpButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpText}>Sign up with mail</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.loginView}>
            <Text style={styles.existingAccount}>Existing account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <MaskedView
                maskElement={
                  <Text style={[styles.loginText, { backgroundColor: 'transparent', color: '#438875' }]}>
                    Log in
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#438875', '#99F2C8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.loginText, { opacity: 0 }]}>Log in</Text>
                </LinearGradient>
              </MaskedView>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={showNicknameModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn nickname của bạn</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                color="gray"
                placeholderTextColor="gray"
                placeholder="Nhập nickname (tối đa 20 ký tự)"
              />
              <TouchableOpacity style={styles.randomIcon} onPress={handleRandomNickname}>
                <Icon name="autorenew" size={24} color="#438875" />
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionText}>Gợi ý: {suggestedNickname}</Text>
            <Pressable style={styles.submitButton} onPress={handleNicknameSubmit}>
              <Text style={styles.submitButtonText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    color: 'gray',
  },
  randomIcon: {
    padding: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#438875',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  desContainer: {
    padding: width * 0.01,
    marginLeft: width * 0.15,
    justifyContent: 'flex-start',
    width: '95%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  viewBoarding: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    alignItems: 'center',
    paddingBottom: height * 0.05,
    backgroundColor: '#121212',
    zIndex: 1,
  },
  image1: {
    width: width * 0.82,
    height: height * 0.42,
    position: 'absolute',
    top: height * 0.06,
  },
  textHeader: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#ffffff',
    width: '80%',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: width * 0.05,
  },
  iconWrapper: {
    backgroundColor: '#F7F7FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 999,
    width: width * 0.12,
    height: width * 0.12,
    marginVertical: width * 0.06,
  },
  icon: {
    width: width * 0.06,
    height: width * 0.06,
    resizeMode: 'contain',
  },
  orContainer: {
    marginVertical: width * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: width * 0.05,
  },
  orLine: {
    width: width * 0.3,
    height: 1,
    backgroundColor: '#CDD1D0',
  },
  orText: {
    fontWeight: '500',
    fontSize: width * 0.045,
    color: '#fff',
  },
  signUpButton: {
    height: height * 0.06,
    width: width * 0.8,
    borderRadius: width * 0.04,
    backgroundColor: '#002DE3',
    alignContent: 'center',
    justifyContent: 'center',
  },
  btnContainer: {
    padding: 0.02,
  },
  signUpText: {
    fontSize: width * 0.04,
    color: 'black',
    textAlign: 'center',
  },
  existingAccount: {
    color: '#B9C1BE',
    fontSize: width * 0.035,
  },
  loginText: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
  },
  loginView: {
    padding: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Boarding;
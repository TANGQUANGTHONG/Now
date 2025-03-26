import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Modal, Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import database from '@react-native-firebase/database';
import { encryptMessage } from '../../cryption/Encryption';
import { saveCurrentUserAsyncStorage, saveChatsAsyncStorage } from '../../storage/Storage';
import LoadingModal from '../../loading/LoadingModal';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Thêm state riêng cho Google loading
  const [errors, setErrors] = useState({});
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState('');
  const [name, setName] = useState('');

  const defaultImage = 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg';

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
    });

    const user = auth().currentUser;
    if (user) {
      saveCurrentUserAsyncStorage();
    }
  }, []);

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

  const updateUserStatus = async (userId, isOnline) => {
  if (!userId) return;
  try {
    await database()
      .ref(`/users/${userId}`)
      .update({
        isOnline,
        lastActive: isOnline ? database.ServerValue.TIMESTAMP : null,
      });
    console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Trong signInWithGoogle
const signInWithGoogle = async () => {
  try {
    setIsGoogleLoading(true);
    await GoogleSignin.signOut();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const { idToken } = userInfo.data;
    if (!idToken) throw new Error('Không lấy được idToken từ Google Sign-In.');
    const { name, email, photo } = userInfo.data.user;
    if (!name || !email) throw new Error('Không lấy được thông tin người dùng từ Google.');

    setName(name);
    setEmail(email);

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    const userId = userCredential.user.uid;
    const userRef = database().ref(`/users/${userId}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      const userData = {
        name: encryptMessage(name),
        email: encryptMessage(email),
        Image: encryptMessage(photo || defaultImage),
        isCompleteNickname: false,
        countChat: 100,
        createdAt: database.ServerValue.TIMESTAMP,
        isOnline: true, // Khởi tạo trạng thái online
        lastActive: database.ServerValue.TIMESTAMP, // Khởi tạo lastActive
      };
      await userRef.set(userData);
    } else {
      const userData = snapshot.val();
      const updates = {};
      if (!userData.name) updates.name = encryptMessage(name);
      if (!userData.email) updates.email = encryptMessage(email);
      if (!userData.Image) updates.Image = encryptMessage(photo || defaultImage);
      if (!userData.createdAt) updates.createdAt = database.ServerValue.TIMESTAMP;
      if (Object.keys(updates).length > 0) await userRef.update(updates);
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
      await updateUserStatus(userId, true); // Cập nhật trạng thái online nếu đã có nickname
      navigation.navigate('HomeNavigation');
    }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrors({ ...errors, general: 'Bạn đã hủy đăng nhập bằng Google.' });
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrors({ ...errors, general: 'Google Play Services không khả dụng.' });
      } else {
        setErrors({ ...errors, general: 'Lỗi đăng nhập: ' + error.message });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleNicknameSubmit = async () => {
    if (nickname.length > 20) {
      setErrors({ ...errors, general: 'Nickname tối đa 20 ký tự!' });
      return;
    }
    if (!nickname) {
      setErrors({ ...errors, general: 'Vui lòng nhập nickname!' });
      return;
    }
  
    const processedNickname = removeVietnameseDiacritics(nickname);
    const encryptedNickname = encryptMessage(processedNickname);
    try {
      setIsGoogleLoading(true);
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
      const userRef = database().ref(`/users/${userId}`);
      await userRef.update({
        nickname: encryptedNickname,
        isCompleteNickname: true,
      });
      await updateUserStatus(userId, true); // Cập nhật trạng thái online sau khi lưu nickname
      setShowNicknameModal(false);
      navigation.navigate('HomeNavigation');
    } catch (error) {
      console.log('Error saving nickname:', error);
      setErrors({ ...errors, general: 'Lỗi khi lưu nickname: ' + error.message });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRandomNickname = () => {
    if (name.trim()) {
      const newNickname = generateRandomNickname(name);
      setNickname(newNickname);
      setSuggestedNickname(newNickname);
    } else {
      setErrors({ ...errors, general: 'Không có tên để tạo nickname!' });
    }
  };

  const validateFields = () => {
    let newErrors = {};

    if (!email.trim()) newErrors.email = 'Email không được để trống';
    else if (!isValidEmail(email)) newErrors.email = 'Email không hợp lệ';
    if (!password.trim()) newErrors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginWithEmailAndPass = async () => {
    const isValid = validateFields();
    if (!isValid) return;
  
    setIsLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      await updateUserStatus(userId, true); // Cập nhật trạng thái online sau khi đăng nhập
      setPassword('');
      setEmail('');
      navigation.navigate('HomeNavigation');
    } catch (err) {
      console.log(err);
      setErrors({ ...errors, general: getFirebaseErrorMessage(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = () => navigation.navigate('ForgotPassword');
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isValidEmail(email) && password.length >= 6;

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Không tìm thấy người dùng với email này';
      case 'auth/wrong-password':
        return 'Mật khẩu không đúng';
      case 'auth/invalid-email':
        return 'Email không hợp lệ';
      default:
        return 'Có lỗi xảy ra, vui lòng thử lại';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Boarding")}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <MaskedView
            maskElement={
              <Text style={[styles.title, { backgroundColor: 'transparent', color: '#99F2C8' }]}>
                Log in to Now
              </Text>
            }
          >
            <LinearGradient
              colors={['#438875', '#99F2C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>Log in to Now</Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.subtitle}>Welcome back! Sign in using your email to continue us</Text>

          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <TouchableOpacity onPress={signInWithGoogle} disabled={isGoogleLoading}>
                <Image
                  style={styles.icon}
                  source={require('../auth/assets/icon/icon_google.png')}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.errorInput]}
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="gray"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              color="gray"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.errorInput]}
                placeholder="Enter your password"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                color="gray"
                secureTextEntry={secureText}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={secureText ? 'eye-off' : 'eye'}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            disabled={!isFormValid || isLoading}
            onPress={loginWithEmailAndPass}
          >
            <LinearGradient
              colors={
                isFormValid && !isLoading
                  ? ['#438875', '#99F2C8']
                  : ['#d3d3d3', '#d3d3d3']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginText}>Log in</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showNicknameModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose your nickname</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputModal}
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={20}
                  color="gray"
                  placeholderTextColor="gray"
                  placeholder="Enter nickname (maximum 20 characters)"
                />
                <TouchableOpacity style={styles.randomIcon} onPress={handleRandomNickname}>
                  <MaterialIcon name="autorenew" size={24} color="#438875" />
                </TouchableOpacity>
              </View>
              <Text style={styles.suggestionText}>Suggest: {suggestedNickname}</Text>
              <Pressable style={styles.submitButton} onPress={handleNicknameSubmit}>
                <Text style={styles.submitButtonText}>Confilm</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Thêm LoadingModal cho Google Sign-In */}
        <LoadingModal visible={isGoogleLoading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    justifyContent: 'center',
    marginTop: height * 0.04,
    paddingHorizontal: width * 0.05,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.03,
    left: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: height * 0.07,
  },
  subtitle: {
    fontSize: width * 0.045,
    textAlign: 'center',
    color: 'gray',
    marginVertical: height * 0.015,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: height * 0.03,
  },
  iconWrapper: {
    backgroundColor: '#1E1E1E',
    borderRadius: width * 0.1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  icon: {
    width: width * 0.08,
    height: width * 0.08,
  },
  inputContainer: {
    marginTop: height * 0.03,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.04,
    borderColor: '#4A4A4A',
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.04,
    color: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  errorInput: {
    borderColor: '#FF4D4D',
    borderWidth: 2,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: width * 0.035,
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: width * 0.03,
  },
  bottomContainer: {
    marginTop: height * 0.05,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
  },
  loginButton: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    borderRadius: width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  loginText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: width * 0.045,
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputModal: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    color: '#FFFFFF',
    fontSize: width * 0.04,
  },
  randomIcon: {
    position: 'absolute',
    right: 10,
    top: 13,
  },
  suggestionText: {
    color: '#99F2C8',
    fontSize: width * 0.035,
    marginTop: 10,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#438875',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});

export default Login;
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState({}); // Thêm state để quản lý lỗi
  
  GoogleSignin.configure({
    webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      saveCurrentUserAsyncStorage();
    }
  }, []);

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
    if (!isValid) {
      return; // Dừng nếu có lỗi
    }

    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      navigation.navigate('TabHome');
      setPassword('');
      setEmail('');
    } catch (err) {
      console.log(err);
      setErrors({ ...errors, general: getFirebaseErrorMessage(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

async function signInWithGoogle() {
  try {
    setIsLoading(true);
    await GoogleSignin.signOut();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.idToken || signInResult.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found');
    }

    const name = signInResult.data.user.name;
    const avatar = signInResult.data.user.photo;
    const gmail = signInResult.data.user.email;

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    const userId = userCredential.user.uid;

    const userRef = database().ref(`/users/${userId}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      await userRef.set({
        name: encryptMessage(name),
        email: encryptMessage(gmail),
        Image: encryptMessage(avatar),
        nickname: encryptMessage(nickname),
        createdAt: database.ServerValue.TIMESTAMP,
      });
      await saveCurrentUserAsyncStorage();
      await saveChatsAsyncStorage();
      console.log('Thông tin người dùng đã đc lưu');
    } else {
      console.log('Đăng nhập thành công');
      await saveCurrentUserAsyncStorage();
      await saveChatsAsyncStorage();
    }

    // Kiểm tra trạng thái đăng nhập
    const currentUser = auth().currentUser;
    if (currentUser) {
      console.log('User is signed in after Google Sign-in:', currentUser.email);
      navigation.navigate('TabHome');
    } else {
      console.log('No user is signed in after Google Sign-in');
    }
  } catch (error) {
    console.log('Google Sign-In Error:', error);
  } finally {
    setIsLoading(false);
  }
}

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

          <Text style={styles.subtitle}>Welcome back! Sign in using your social account or email to continue us</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle}>
              <Image source={require('../auth/assets/icon/google.png')} style={styles.socialIcon} />
            </TouchableOpacity>
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
  inputContainer: {
    marginTop: height * 0.03,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E', // Nền tối giống SignUp
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.04, // Bo góc mềm mại
    borderColor: '#4A4A4A', // Viền xám nhạt
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.04,
    color: '#FFFFFF', // Chữ trắng
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  errorInput: {
    borderColor: '#FF4D4D', // Viền đỏ khi có lỗi
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
    paddingBottom: height * 0.03, // Tăng padding dưới
  },
  loginButton: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    borderRadius: width * 0.04, // Bo góc mềm mại
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  loginText: {
    fontWeight: 'bold',
    color: '#fff', // Chữ trắng
    fontSize: width * 0.045, // Kích thước chữ giống SignUp
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04, // Kích thước chữ lớn hơn một chút
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: height * 0.03,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 1,
    marginHorizontal: width * 0.02,
  },
  socialIcon: {
    width: width * 0.08,
    height: width * 0.08,
  },
});

export default Login;
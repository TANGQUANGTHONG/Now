import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from '../../Styles/auth/Sign_up';
import { encryptMessage } from '../../cryption/Encryption';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { oStackHome } from '../../navigations/HomeNavigation';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setnickname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});
  const defaultImage = 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg';


 GoogleSignin.configure({
    webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

  async function signInWithGoogle() {
  try {
    await GoogleSignin.signOut(); 

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();

    const idToken = signInResult.idToken || signInResult.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found');
    }

    // Lấy thông tin người dùng từ kết quả Google Sign-In


    console.log(signInResult)
    const name = signInResult.data.user.name;

    const avatar = signInResult.data.user.photo;

    const email  = signInResult.data.user.email;

    console.log('User email:', signInResult.data.user.email);
    // Log ra thông tin người dùng
    console.log('User Name:', signInResult.data.user.name);
    console.log('User Photo:', signInResult.data.user.photo);

    // Tạo Google credential từ Firebase auth
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Đăng nhập với Google credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    const userId = userCredential.user.uid;

    // Kiểm tra xem người dùng đã tồn tại trong Realtime Database chưa
    const userRef = database().ref(`/users/${userId}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      // Người dùng chưa tồn tại, lưu thông tin vào database
      await userRef.set({
        name: encryptMessage(name),
          email: encryptMessage(email),
          Image: encryptMessage(avatar),
          nickname: encryptMessage(nickname),
          createdAt: database.ServerValue.TIMESTAMP,
      });
      console.log('User information saved to Realtime Database.');
    } else {
      console.log('User already exists in Realtime Database.');
    }
  } catch (error) {
    console.log('Google Sign-In Error:', error);
  }
}
  
  // Kiểm tra nếu người dùng đã nhập đủ dữ liệu
  const isFormComplete = () => {
    return name && email && password && confirmPassword;
  };

  const validateFields = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Tên không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Email không hợp lệ';
    if (password.length < 6)
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Mật khẩu không khớp';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const Sign_Up = async () => {
    if (!validateFields()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin nhập vào.');
      return;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      await userCredential.user.sendEmailVerification();

      await database()
        .ref(`/users/${userId}`)
        .set({
          name: encryptMessage(name),
          email: encryptMessage(email),
          Image: encryptMessage(defaultImage),
          nickname: encryptMessage(nickname),
          createdAt: database.ServerValue.TIMESTAMP,
        })
        .then(() => console.log('User saved successfully'))
        .catch((error) => console.error('Firebase Database Error:', error));
    } catch (error) {
      Alert.alert('Lỗi', getFirebaseErrorMessage(error.code));
    }
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email này đã được sử dụng';
      case 'auth/invalid-email':
        return 'Email không hợp lệ';
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu, hãy chọn mật khẩu mạnh hơn';
      default:
        return 'Có lỗi xảy ra, vui lòng thử lại';
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Boarding')}>
              <Icon name="arrow-left" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.content}>
              {/* MaskedView with LinearGradient for title */}
              <MaskedView
                maskElement={
                  <Text style={[styles.title, { backgroundColor: 'transparent' }]}>
                    Sign Up with Email
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#438875', '#99F2C8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {/* Invisible text to preserve spacing */}
                  <Text style={[styles.title, { opacity: 0 }]}>Sign Up with Email</Text>
                </LinearGradient>
              </MaskedView>

              <Text style={styles.subtitle}>
                Get chatting with friends and family today!
              </Text>

              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle}>
                  <Image source={require('../auth/assets/icon/google.png')} style={styles.socialIcon} />
                </TouchableOpacity>


              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.name && styles.errorInput]}
                  value={name}
                  placeholder='Enter your name'
                  onChangeText={setName}
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email && styles.errorInput]}
                  value={email}
                  placeholder='Enter your Email'
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.password && styles.errorInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder='Enter your password'
                    placeholderTextColor="gray"
                    secureTextEntry={secureText}
                    color="black"
                  />
                  <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeIcon}>
                    <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.errorInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder='Re-enter password'
                    placeholderTextColor={'#8C96A2'}
                    secureTextEntry={secureText}
                    color="black"
                  />
                  <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeIcon}>
                    <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                disabled={!isFormComplete()}
                onPress={() => {
                  if (validateFields()) {
                    Sign_Up();
                  }
                }}>
                <LinearGradient
                  colors={isFormComplete() ? ['#438875', '#99F2C8'] : ['#d3d3d3', '#d3d3d3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}>
                  <Text style={styles.loginText}>Sign Up</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
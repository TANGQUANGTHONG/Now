import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from '../../Styles/auth/Sign_up';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption'; // Thêm decryptMessage
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

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
  
      if (!idToken) throw new Error('No ID token found');
  
      const name = signInResult.data.user.name;
      const avatar = signInResult.data.user.photo;
      const email = signInResult.data.user.email;
  
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const userId = userCredential.user.uid;
  
      const userRef = database().ref(`/users/${userId}`);
      const snapshot = await userRef.once('value');
      
      if (!snapshot.exists()) {
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
  
      // Kiểm tra trạng thái đăng nhập
      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log('User is signed in after Google Sign-in:', currentUser.email);
      } else {
        console.log('No user is signed in after Google Sign-in');
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
    }
  }
  

  const isFormComplete = () => {
    return name && email && password && confirmPassword && nickname;
  };

  // Hàm kiểm tra tính duy nhất của nickname
  const checkNicknameUniqueness = async (nicknameToCheck) => {
    if (!nicknameToCheck.trim()) return false;

    try {
      const usersRef = database().ref('/users');
      const snapshot = await usersRef.once('value');

      let isUnique = true;
      if (snapshot.exists()) {
        const users = snapshot.val();
        // Duyệt qua từng user để kiểm tra nickname
        for (const userId in users) {
          const user = users[userId];
          if (user.nickname) {
            const decryptedNickname = decryptMessage(user.nickname);
            if (decryptedNickname.toLowerCase() === nicknameToCheck.toLowerCase()) {
              isUnique = false;
              break;
            }
          }
        }
      }
      return isUnique; // Trả về true nếu nickname chưa tồn tại
    } catch (error) {
      console.log('Error checking nickname uniqueness:', error);
      return false;
    }
  };

  const validateFields = async () => {
    let newErrors = {};

    // Kiểm tra các trường khác
    if (!name.trim()) newErrors.name = 'Tên không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email không hợp lệ';
    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname không được để trống';
    } else if (nickname.length > 10) {
      newErrors.nickname = 'Nickname không được dài quá 10 ký tự';
    }
    if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';

    // Kiểm tra tính duy nhất của nickname
    if (!newErrors.nickname) {
      setIsCheckingNickname(true);
      const isUnique = await checkNicknameUniqueness(nickname);
      setIsCheckingNickname(false);

      if (!isUnique) {
        newErrors.nickname = 'Nickname đã tồn tại, vui lòng chọn nickname khác';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const Sign_Up = async () => {
    const isValid = await validateFields();
 
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      // Lưu thông tin người dùng vào node /users
      await database()
        .ref(`/users/${userId}`)
        .set({
          name: encryptMessage(name),
          email: encryptMessage(email),
          Image: encryptMessage(defaultImage),
          nickname: encryptMessage(nickname),
          createdAt: database.ServerValue.TIMESTAMP,
        });

      await userCredential.user.sendEmailVerification();
      console.log('User saved successfully');
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        extraHeight={Platform.OS === 'ios' ? 100 : 150}
      >
        <View style={styles.container}>
          {/* Nút quay lại */}
          <View style={styles.backButton}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Boarding');
                console.log('Back ve boarding');
              }}
            >
              <Icon name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Nội dung chính */}
          <View style={styles.content}>
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
                <Text style={[styles.title, { opacity: 0 }]}>Sign Up with Email</Text>
              </LinearGradient>
            </MaskedView>

            <Text style={styles.subtitle}>Get chatting with friends and family today!</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle}>
                <Image
                  source={require('../auth/assets/icon/google.png')}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Các trường nhập liệu */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.name && styles.errorInput]}
                value={name}
                placeholder="Enter your name"
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
                placeholder="Enter your Email"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={'#8C96A2'}
                color="black"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.nickname && styles.errorInput]}
                value={nickname}
                placeholder="Enter your nickname"
                onChangeText={setNickname}
                autoCapitalize="none"
                placeholderTextColor={'#8C96A2'}
                color="black"
                maxLength={10}
              />
              {isCheckingNickname && <Text style={styles.validText}>Đang kiểm tra...</Text>}
              {errors.nickname && <Text style={styles.errorText}>{errors.nickname}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, errors.password && styles.errorInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="gray"
                  secureTextEntry={secureText}
                  color="black"
                />
                <TouchableOpacity
                  onPress={() => setSecureText(!secureText)}
                  style={styles.eyeIcon}
                >
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
                  placeholder="Re-enter password"
                  placeholderTextColor={'#8C96A2'}
                  secureTextEntry={secureText}
                  color="black"
                />
                <TouchableOpacity
                  onPress={() => setSecureText(!secureText)}
                  style={styles.eyeIcon}
                >
                  <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Nút Sign Up */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              disabled={!isFormComplete() || isCheckingNickname}
              onPress={() => {
                if (isFormComplete()) {
                  Sign_Up();
                }
              }}
            >
              <LinearGradient
                colors={
                  isFormComplete() && !isCheckingNickname
                    ? ['#438875', '#99F2C8']
                    : ['#d3d3d3', '#d3d3d3']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;
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
  Modal,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../Styles/auth/Sign_up';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { saveCurrentUserAsyncStorage, saveChatsAsyncStorage } from '../../storage/Storage';
import LoadingModal from '../../loading/LoadingModal';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [suggestedNickname, setSuggestedNickname] = useState('');

  const defaultImage = 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg';

  GoogleSignin.configure({
    webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

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
          isOnline: isOnline,
          lastActive: database.ServerValue.TIMESTAMP,
        });
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  async function signInWithGoogle() {
    try {
      setLoading(true);
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
        // Cập nhật trạng thái online sau khi hoàn tất đăng nhập và có nickname
        await updateUserStatus(userId, true);
        navigation.navigate('HomeNavigation');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Đăng nhập bị hủy.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services không khả dụng.');
      } else {
        Alert.alert('Đăng nhập bị hủy');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleNicknameSubmit = async () => {
    if (nickname.length > 20) {
      Alert.alert('Nickname tối đa 20 ký tự!');
      return;
    }
    if (!nickname) {
      Alert.alert('Vui lòng nhập nickname!');
      return;
    }
    const processedNickname = removeVietnameseDiacritics(nickname);
    const encryptedNickname = encryptMessage(processedNickname);
    try {
      setLoading(true);
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
      const userRef = database().ref(`/users/${userId}`);
      await userRef.update({
        nickname: encryptedNickname,
        isCompleteNickname: true,
      });
      // Cập nhật trạng thái online sau khi hoàn tất nhập nickname
      await updateUserStatus(userId, true);
      setShowNicknameModal(false);
      navigation.navigate('HomeNavigation');
    } catch (error) {
      console.log('Error saving nickname:', error);
      Alert.alert('Lỗi khi lưu nickname: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (text) => {
    setName(text);
    if (text.trim()) {
      setNickname(generateRandomNickname(text));
    } else {
      setNickname('');
    }
  };

  const handleRandomNickname = () => {
    if (name.trim()) {
      const newNickname = generateRandomNickname(name);
      setNickname(newNickname);
      setSuggestedNickname(newNickname);
    } else {
      Alert.alert('Thông báo', 'Vui lòng nhập tên trước!');
    }
  };

  const isFormComplete = () => {
    return name && email && password && confirmPassword && nickname;
  };

  const checkNicknameUniqueness = async (nicknameToCheck) => {
    if (!nicknameToCheck.trim()) return false;
    try {
      const usersRef = database().ref('/users');
      const snapshot = await usersRef.once('value');
      let isUnique = true;
      if (snapshot.exists()) {
        const users = snapshot.val();
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
      return isUnique;
    } catch (error) {
      console.log('Error checking nickname uniqueness:', error);
      return false;
    }
  };

  const validateFields = async () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Tên không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email không hợp lệ';
    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname không được để trống';
    } else if (nickname.length > 20) {
      newErrors.nickname = 'Nickname không được dài quá 20 ký tự';
    }
    if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
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
    if (!isValid) return;
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      const encryptedNickname = encryptMessage(nickname);
      await database()
        .ref(`/users/${userId}`)
        .set({
          name: encryptMessage(name),
          email: encryptMessage(email),
          Image: encryptMessage(defaultImage),
          nickname: encryptedNickname,
          isCompleteNickname: true,
          countChat: 100,
          createdAt: database.ServerValue.TIMESTAMP,
        });
      // Cập nhật trạng thái online sau khi tạo tài khoản bằng email/password
      await updateUserStatus(userId, true);
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        extraHeight={Platform.OS === 'ios' ? 100 : 150}
      >
        <View style={styles.container}>
          <LoadingModal visible={loading} />
          <View style={styles.backButton}>
            <TouchableOpacity onPress={() => navigation.navigate('Boarding')}>
              <Icon name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <MaskedView
              maskElement={<Text style={[styles.title, { backgroundColor: 'transparent' }]}>Sign Up with Email</Text>}
            >
              <LinearGradient colors={['#438875', '#99F2C8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[styles.title, { opacity: 0 }]}>Sign Up with Email</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.subtitle}>Get chatting with friends and family today!</Text>

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

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.name && styles.errorInput]}
                value={name}
                placeholder="Enter your name"
                onChangeText={handleNameChange}
                autoCapitalize="none"
                placeholderTextColor={'#8C96A2'}
                color="#8C96A2"
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
                color="#8C96A2"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, errors.nickname && styles.errorInput]}
                  value={nickname}
                  placeholder="Enter your nickname"
                  onChangeText={setNickname}
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="#8C96A2"
                  maxLength={20}
                />
                <TouchableOpacity onPress={handleRandomNickname} style={styles.eyeIcon}>
                  <MaterialIcon name="autorenew" size={24} color="#8C96A2" />
                </TouchableOpacity>
              </View>
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
                  placeholderTextColor="#8C96A2"
                  secureTextEntry={secureText}
                  color="#8C96A2"
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                  <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="#8C96A2" />
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
                  color="#8C96A2"
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                  <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="#8C96A2" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <TouchableOpacity
              disabled={!isFormComplete() || isCheckingNickname}
              onPress={Sign_Up}
            >
              <LinearGradient
                colors={isFormComplete() && !isCheckingNickname ? ['#438875', '#99F2C8'] : ['#6f6e6e', '#6f6e6e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Modal cho nickname */}
         
        </View>
        <Modal visible={showNicknameModal} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn nickname của bạn</Text>
                <View style={styles.inputContainer}>
  <TextInput
    style={styles.inputModal}
    value={nickname}
    onChangeText={setNickname}
    maxLength={20}
    color="gray"
    placeholderTextColor="gray"
    placeholder="Nhập nickname (tối đa 20 ký tự)"
  />
  <TouchableOpacity style={styles.iconInsideInput} onPress={handleRandomNickname}>
    <MaterialIcon name="autorenew" size={24} color="#438875" />
  </TouchableOpacity>
</View>

                <Text style={styles.suggestionText}>Gợi ý: {suggestedNickname}</Text>
                <Pressable style={styles.submitButton} onPress={handleNicknameSubmit}>
                  <Text style={styles.submitButtonText}>Xác nhận</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;
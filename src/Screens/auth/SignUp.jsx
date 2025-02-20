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
import auth, { firebase } from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
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

  // 🔹 Xác thực dữ liệu nhập
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

  // 🔹 Xử lý đăng ký
  const Sign_Up = async () => {
    if (!validateFields()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin nhập vào.');
      return;
    }
    
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      
      // Gửi email xác thực
      await userCredential.user.sendEmailVerification();
      
      // Lưu user vào Firebase Database
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
  
  

  // 🔹 Xử lý lỗi Firebase
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
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>Sign up with Email</Text>
              <Text style={styles.subtitle}>
                Get chatting with friends and family today!
              </Text>

                    <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Image source={require('../auth/assets/icon/google.png')} style={styles.socialIcon} />
                </TouchableOpacity>
              
                <TouchableOpacity style={styles.socialButton}>
                  <Image source={require('../auth/assets/icon/facebook.png')} style={styles.socialIcon} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.validText}>Your Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.errorInput]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.validText}>Your email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.errorInput]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.validText}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.password && styles.errorInput]}
                    value={password}
                    onChangeText={setPassword}
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
                <Text style={styles.validText}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.errorInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
                style={styles.loginButton} 
                onPress={() => {
                  if (validateFields()) {
                    Sign_Up();
                  }
                }}>
                <Text style={styles.loginText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
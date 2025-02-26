import React, { useState } from 'react';
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

const {width, height} = Dimensions.get('window');

const Login = ({navigation}) => {
  const [email, setEmail] = useState('nguyenhongphong1010.02@gmail.com');
  const [password, setPassword] = useState('111111');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // State loading
  const [nickname, setnickname] = useState('')

  GoogleSignin.configure({
    webClientId: '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
  });

  const loginWithEmailAndPass = () => {
    setIsLoading(true); // Bắt đầu loading
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        navigation.navigate('TabHome');
        setPassword('');
        setEmail('');
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false)); 
  };

  async function signInWithGoogle() {
    try {
      await GoogleSignin.signOut(); // Clear any existing sessions
  
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
  
      const idToken = signInResult.idToken || signInResult.data?.idToken;
  
      if (!idToken) {
        throw new Error('No ID token found');
      }
  
      // Lấy thông tin người dùng từ kết quả Google Sign-In
  
      const name = signInResult.data.user.name;
  
      const avatar = signInResult.data.user.photo;
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
        console.log('Thông tin người dùng đã đc lưu');
        navigation.navigate('TabHome');
      } else {
        console.log('Đăng nhập thành công');
        navigation.navigate('TabHome');

      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
    }
  }

  const onForgotPassword = () => navigation.navigate('ForgotPassword');
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isValidEmail(email) && password.length >= 6;

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
          {/* MaskedView with LinearGradient for title */}
          <MaskedView
            maskElement={
              <Text style={[styles.title, { backgroundColor: 'transparent' }]}>
                Log in to Now
              </Text>
            }
          >
            <LinearGradient
              colors={['#438875', '#99F2C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {/* Invisible text to preserve spacing */}
              <Text style={[styles.title, { opacity: 0 }]}>Log in to Now</Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.subtitle}>Welcome back! Sign in using your social account or email to continue us</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle} >
              <Image source={require('../auth/assets/icon/google.png')} style={styles.socialIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="gray"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              color="gray"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                color="gray"
                secureTextEntry={secureText}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={styles.eyeIcon}>
                <Icon
                  name={secureText ? 'eye-off' : 'eye'}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            disabled={!isFormValid || isLoading} // Vô hiệu hóa khi loading
            onPress={loginWithEmailAndPass}
          >
            {isFormValid ? (
              <LinearGradient
                colors={['#438875', '#99F2C8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" /> // Loading spinner
                ) : (
                  <Text style={[styles.loginText, { color: '#e4e2de' }]}>Log in</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.loginButton, { backgroundColor: '#e4e2de' }]}>
                <Text style={[styles.loginText, { color: 'gray' }]}>Log in</Text>
              </View>
            )}
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
    marginTop: height * 0.04,
  },
  input: {
    width: '100%',
    backgroundColor: '#e4e2de',
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.03,
    borderColor: '#CDD1D0',
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.03,
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
  },
  loginButton: {
    padding: height * 0.02,
    alignItems: 'center',
    borderRadius: width * 0.03,
    marginBottom: height * 0.015,
  },
  loginText: {
    fontWeight: 'bold',
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
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

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {getAuth} from '@react-native-firebase/auth';

import firestore from '@react-native-firebase/firestore';

const {width, height} = Dimensions.get('window');

const Login = ({navigation}) => {
  const [email, setEmail] = useState('phong@gmail.com');
  const [password, setPassword] = useState('123456');
  const [secureText, setSecureText] = useState(true);

  const auth = getAuth();
  const loginWithEmailAndPass = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        addUserToFirestore(user); // Gọi hàm để lưu user vào Firestore
        navigation.navigate('TabHome');
        setPassword('');
        setEmail('');
      })
      .catch(err => console.log(err));
  };

  const addUserToFirestore = async user => {
    try {
      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid, // Lưu UID thay vì email
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('User added to Firestore with UID!');
    } catch (error) {
      console.log('Error adding user: ', error);
    }
  };

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isValidEmail(email) && password.length >= 6;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        {/* Nút back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('SignUp')}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Log in to Now</Text>
          <Text style={styles.subtitle}>
            Welcome back! Sign in using your social account or email to continue
            us
          </Text>

          {/* Icon đăng nhập bằng mạng xã hội */}
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{uri: 'https://i.imgur.com/yh45vCH.png'}}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{
                  uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png',
                }}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{
                  uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/640px-Apple_logo_black.svg.png',
                }}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Ô nhập email */}
          <View style={styles.inputContainer}>
            <Text style={styles.validText}>Your email</Text>
            <TextInput
              style={styles.input}
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="gray"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              color="black"
            />
          </View>

          {/* Ô nhập password */}
          <View style={styles.inputContainer}>
            <Text style={styles.validText}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                color="black"
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

        {/* Nút đăng nhập và quên mật khẩu */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              isFormValid && styles.activeLoginButton,
            ]}
            disabled={!isFormValid}
            onPress={loginWithEmailAndPass}>
            <Text
              style={[styles.loginText, isFormValid && styles.activeLoginText]}>
              Log in
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
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
    backgroundColor: '#fff',
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
    color: 'black',
    marginTop: height * 0.07,
  },
  subtitle: {
    fontSize: width * 0.045,
    textAlign: 'center',
    color: 'gray',
    marginVertical: height * 0.015,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.05,
    marginVertical: height * 0.025,
  },
  socialButton: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    width: width * 0.08,
    height: width * 0.08,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.03,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#CDD1D0',
    marginHorizontal: width * 0.025,
  },
  inputContainer: {
    marginTop: height * 0.04,
  },
  validText: {
    color: '#24786D',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: height * 0.07,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD1D0',
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
    backgroundColor: '#f5f5f5',
    padding: height * 0.02,
    alignItems: 'center',
    borderRadius: width * 0.03,
    marginBottom: height * 0.015,
  },
  activeLoginButton: {
    backgroundColor: '#24786D',
  },
  loginText: {
    color: 'gray',
  },
  activeLoginText: {
    color: 'white',
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#24786D',
    fontWeight: 'bold',
  },
});

export default Login;

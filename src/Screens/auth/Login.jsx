import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  StyleSheet, Dimensions, KeyboardAvoidingView, 
  Platform, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getAuth } from '@react-native-firebase/auth';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const auth = getAuth();
  const loginWithEmailAndPass = () => {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        navigation.navigate('TabHome');
        setPassword('');
        setEmail('');
      })
      .catch((err) => console.log(err));
  };
  
  const onForgotPassword = () => navigation.navigate('ForgotPassword');
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Log in to Now</Text>
          <Text style={styles.subtitle}>Welcome back! Sign in using your social account or email to continue us</Text>

          <View style={styles.socialContainer}>
  <TouchableOpacity style={styles.socialButton}>
    <Image source={require('../auth/assets/icon/google.png')} style={styles.socialIcon} />
  </TouchableOpacity>

  <TouchableOpacity style={styles.socialButton}>
    <Image source={require('../auth/assets/icon/facebook.png')} style={styles.socialIcon} />
  </TouchableOpacity>
</View>



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
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: isFormValid ? '#002DE3' : '#f5f5f5' }]} 
            disabled={!isFormValid} 
            onPress={loginWithEmailAndPass}
          >
            <Text style={[styles.loginText, { color: isFormValid ? 'white' : 'gray' }]}>Log in</Text>
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
    color: '#002DE3',
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
  validText: {
    color: '#002DE3',
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
    color: '#002DE3',
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
  socialText: {
    fontSize: width * 0.02,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default Login;

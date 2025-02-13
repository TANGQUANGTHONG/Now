import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// import { styles } from '../../Styles/Login_Sign_Up/Login';

const { height } = Dimensions.get('window'); // Lấy chiều cao màn hình

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Kiểm tra email hợp lệ
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Kiểm tra nếu cả email và password hợp lệ
  const isFormValid = isValidEmail(email) && password.length >= 6;

  return (
    <View style={styles.container}>
      {/* Nút back */}
      <TouchableOpacity style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Log in to Now</Text>
        <Text style={styles.subtitle}>
          Welcome back! Sign in using your social account or email to continue us
        </Text>

        {/* Icon đăng nhập bằng mạng xã hội */}
        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={{ uri: 'https://i.imgur.com/yh45vCH.png' }} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png' }} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/640px-Apple_logo_black.svg.png' }} style={styles.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
        </View>

        {/* Ô nhập email */}
        <View style={styles.inputContainer}>
          <Text style={styles.validText }>
            Your email
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Ô nhập password */}
        <View style={styles.inputContainer}>
          <Text style={ styles.validText}>
            Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Nút đăng nhập và quên mật khẩu ở dưới cùng */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.loginButton, isFormValid && styles.activeLoginButton]} disabled={!isFormValid}>
          <Text style={[styles.loginText, isFormValid && styles.activeLoginText]}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height, // Đặt chiều cao bằng chiều cao màn hình
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    marginTop: 30, // Tăng giá trị này để đẩy nội dung xuống thấp hơn
  },
  
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: 'gray',
    marginTop: 10,
    marginBottom: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 10,
    marginTop: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    width: 30,
    height: 30,
  },
  orText: {
    marginVertical: 10,
    color: 'gray',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  line: {
    flex: 1, // Thanh ngang tự dãn ra hai bên
    height: 1, // Độ dày của thanh ngang
    backgroundColor: '#CDD1D0', // Màu của thanh ngang
    marginHorizontal: 10, // Khoảng cách giữa "OR" và thanh ngang
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
  },
  
  
  inputContainer: {
    width: '100%',
    marginTop: 30,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  validText: {
    color: '#24786D',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD1D0',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  activeLoginButton: {
    backgroundColor: '#24786D', // Chuyển sang màu xanh khi hợp lệ
    
  },
  loginText: {
    color: 'gray',
    fontSize: 18,
  },
  activeLoginText: {
    color: 'white', // Chuyển chữ thành màu trắng khi hợp lệ
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#24786D',
    fontWeight: 'bold',
  },

});

export default LoginScreen;

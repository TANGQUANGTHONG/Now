import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';


const { width, height } = Dimensions.get('window'); 

const Login = (props) => {
    const {navigation} = props
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
        <Pressable onPress={()=> navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="black" />
        </Pressable>
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
        <TouchableOpacity style={[styles.loginButton, isFormValid && styles.activeLoginButton]} disabled={!isFormValid} onPress={()=> navigation.navigate('TabHome')}>
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
    padding: width * 0.05, // Sử dụng 5% chiều rộng của màn hình làm padding
  },
  content: {
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    marginTop: height * 0.04, // Tăng giá trị này để đẩy nội dung xuống thấp hơn
  },
  
  backButton: {
    position: 'absolute',
    top: height * 0.03, // Dùng 3% chiều cao màn hình để định vị nút
    left: width * 0.05, // Dùng 5% chiều rộng màn hình để định vị nút
  },
  title: {
    fontSize: width * 0.06, // Đặt fontSize dựa trên chiều rộng màn hình (6%)
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginTop: height * 0.07, // Khoảng cách margin dựa trên chiều cao màn hình
  },
  subtitle: {
    fontSize: width * 0.045, // Font size dựa trên chiều rộng
    textAlign: 'center',
    color: 'gray',
    marginTop: height * 0.015, // Dùng 1.5% chiều cao màn hình làm margin top
    marginBottom: height * 0.025, // Khoảng cách margin dưới là 2.5%
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.05, // Khoảng cách giữa các nút icon
    marginBottom: height * 0.015, // Khoảng cách margin dưới là 1.5%
    marginTop: height * 0.025, // Khoảng cách margin trên là 2.5%
  },
  socialButton: {
    width: width * 0.12, // Đặt chiều rộng là 12% của màn hình
    height: width * 0.12, // Chiều cao bằng chiều rộng để giữ tỉ lệ hình vuông
    borderRadius: width * 0.06, // Bo tròn nửa chiều rộng để tạo thành nút tròn
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    width: width * 0.08, // Chiều rộng của icon là 8% của màn hình
    height: width * 0.08, // Chiều cao tương tự để giữ tỉ lệ hình vuông
  },
  orText: {
    marginVertical: height * 0.015, // Dùng 1.5% chiều cao làm khoảng cách trên và dưới
    color: 'gray',
    textAlign: 'center',
    fontSize: width * 0.045, // Font size dựa trên chiều rộng của màn hình
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.03, // Tăng giá trị margin top để đẩy các thành phần xuống
  },
  line: {
    flex: 1, // Thanh ngang tự dãn ra hai bên
    height: 1, // Độ dày của thanh ngang
    backgroundColor: '#CDD1D0',
    marginHorizontal: width * 0.025, // Khoảng cách hai bên là 2.5% của màn hình
  },
  
  inputContainer: {
    width: '100%',
    marginTop: height * 0.04, // Khoảng cách margin top là 4% của màn hình
  },
  inputLabel: {
    fontSize: width * 0.035, // Đặt font size cho nhãn là 3.5% của chiều rộng màn hình
    marginBottom: height * 0.01, // Khoảng cách dưới là 1% chiều cao màn hình
  },
  validText: {
    color: '#24786D',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: height * 0.07, // Chiều cao của input là 7% của màn hình
    borderBottomWidth: 1,
    borderBottomColor: '#CDD1D0',
    fontSize: width * 0.045, // Font size là 4.5% chiều rộng
    paddingHorizontal: width * 0.03, // Padding bên trong là 3% chiều rộng
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: width * 0.03, // Đặt icon ở bên phải với khoảng cách là 3% chiều rộng
  },
  bottomContainer: {
    position: 'absolute',
    bottom: height * 0.03, // Đặt ở dưới cùng với khoảng cách là 3% chiều cao
    left: width * 0.05, // Khoảng cách từ trái là 5% chiều rộng
    right: width * 0.05, // Khoảng cách từ phải là 5% chiều rộng
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: height * 0.02, // Padding bên trong là 2% chiều cao
    alignItems: 'center',
    borderRadius: width * 0.03, // Bo tròn các góc theo tỷ lệ chiều rộng
    marginBottom: height * 0.015, // Khoảng cách margin dưới là 1.5%
  },
  activeLoginButton: {
    backgroundColor: '#24786D', // Chuyển sang màu xanh khi hợp lệ
  },
  loginText: {
    color: 'gray',
    fontSize: width * 0.045, // Đặt font size dựa trên chiều rộng màn hình
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

export default Login;
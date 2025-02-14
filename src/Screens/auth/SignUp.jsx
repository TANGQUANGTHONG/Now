import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from '../../Styles/Login_Sign_Up/Sign_up';


const { height } = Dimensions.get('window'); // Lấy chiều cao màn hình

const SignUp = (props) => {
  const { navigation } = props
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const validateConfirmPassword = (password, confirmPassword) => password === confirmPassword

  const validateFields = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!validateEmail(email)) newErrors.email = 'Invalid email address';
    if (!validatePassword(password)) newErrors.password = 'Password must be at least 6 characters';
    if (!validateConfirmPassword(password, confirmPassword)) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = validateEmail(email) && validatePassword(password) && validateConfirmPassword(password, confirmPassword) && name.trim();

  return (
    <View style={styles.container}>
      {/* Nút back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Sign up with Email</Text>
        <Text style={styles.subtitle}>
          Get chatting with friends and family today by signing up for our chat app!
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>
            Your Name
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.errorInput]}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>
            Your email
          </Text>
          <TextInput
            style={[styles.input, errors.email && styles.errorInput]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>


        {/* Ô nhập password */}
        <View style={styles.inputContainer}>
          <Text style={styles.validText}>
            Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.errorInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>
            Confirm Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.errorInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>
      </View>

      {/* Nút đăng nhập và quên mật khẩu ở dưới cùng */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.loginButton, isFormValid && styles.activeCreateButton]}
          onPress={() => {
            if (validateFields()) {
              navigation.navigate('Login'); 
            }
          }}
        >
          <Text style={[styles.loginText, isFormValid && styles.activeLoginText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// const styles = StyleSheet.create({
//   container: {
//     height: height, // Đặt chiều cao bằng chiều cao màn hình
//     backgroundColor: '#fff',
//     padding: 20,
//   },
//   content: {
//     justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
//     marginTop: 30, // Tăng giá trị này để đẩy nội dung xuống thấp hơn
//   },
//   errorInput: {
//     borderBottomColor: 'red',
//   },
//   errorText: {
//     color: 'red',
//   },

//   backButton: {
//     position: 'absolute',
//     top: 20,
//     left: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: 'black',
//     marginTop: 50,
//   },
//   subtitle: {
//     fontSize: 18,
//     textAlign: 'center',
//     color: 'gray',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   socialIcons: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 20,
//     marginBottom: 10,
//     marginTop: 20,
//   },
//   socialButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//   },
//   icon: {
//     width: 30,
//     height: 30,
//   },
//   orText: {
//     marginVertical: 10,
//     color: 'gray',
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   orContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 30,
//   },
//   line: {
//     flex: 1, // Thanh ngang tự dãn ra hai bên
//     height: 1, // Độ dày của thanh ngang
//     backgroundColor: '#CDD1D0', // Màu của thanh ngang
//     marginHorizontal: 10, // Khoảng cách giữa "OR" và thanh ngang
//   },
//   activeCreateButton: {
//     backgroundColor: '#24786D',
//   },
//   inputContainer: {
//     width: '100%',
//     marginTop: 30,
//   },
//   inputLabel: {
//     fontSize: 14,
//     marginBottom: 5,
//   },
//   validText: {
//     color: '#24786D',
//     fontWeight: 'bold',
//   },
//   input: {
//     width: '100%',
//     height: 50,
//     borderBottomWidth: 1,
//     borderBottomColor: '#CDD1D0',
//     fontSize: 16,
//     paddingHorizontal: 10,
//   },
//   passwordContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   eyeIcon: {
//     position: 'absolute',
//     right: 10,
//   },
//   bottomContainer: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     right: 20,
//   },
//   loginButton: {
//     width: '100%',
//     backgroundColor: '#f5f5f5',
//     padding: 15,
//     alignItems: 'center',
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   activeLoginButton: {
//     backgroundColor: '#24786D', // Chuyển sang màu xanh khi hợp lệ

//   },
//   loginText: {
//     color: 'gray',
//     fontSize: 18,
//   },
//   activeLoginText: {
//     color: 'white', // Chuyển chữ thành màu trắng khi hợp lệ
//   },
//   forgotPassword: {
//     textAlign: 'center',
//     color: '#24786D',
//     fontWeight: 'bold',
//   },
// });

export default SignUp;
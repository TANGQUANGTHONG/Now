import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

const ChangePasswordScreen = (props) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập thông tin hợp lệ.');
      return;
    }
  
    try {
      setLoading(true); // 🔥 Bật loading khi bắt đầu đổi mật khẩu
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');
  
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      
      setLoading(false);
      props.navigation.goBack();
    } catch (error) {
      setLoading(false);
      Alert.alert('Lỗi', error.message);
    }
  };
  

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' }}>Đổi Mật Khẩu</Text>

      {/* Input Mật khẩu hiện tại */}
      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={22} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Mật khẩu hiện tại"
          secureTextEntry={!showPassword}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#777" />
        </TouchableOpacity>
      </View>

      {/* Input Mật khẩu mới */}
      <View style={styles.inputContainer}>
        <Icon name="lock-reset" size={22} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Mật khẩu mới"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#777" />
        </TouchableOpacity>
      </View>

      {/* Button Đổi mật khẩu */}
      <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
  <View style={styles.buttonContent}>
    {loading ? (
      <LottieView
        source={require('../../loading/loading3.json')} 
        autoPlay
        loop
        style={styles.loadingAnimation}
      />
    ) : (
      <Text style={styles.buttonText}>Đổi Mật Khẩu</Text>
    )}
  </View>
</TouchableOpacity>


    </View>
  );
};

// Styles
const styles = {
  buttonContent: {
    height: 35, // Đặt chiều cao cố định (bằng với chiều cao chữ)
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 60,  // Giữ animation nhỏ hơn một chút để không làm thay đổi layout
    height: 55,
  },
  
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    width: '100%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007bff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
};

export default ChangePasswordScreen;

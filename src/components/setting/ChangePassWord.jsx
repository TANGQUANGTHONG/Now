import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChangePasswordScreen = (props) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');

      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      Alert.alert('Thành công', 'Mật khẩu đã được đổi.');
      props.navigation.goBack();
    } catch (error) {
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
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Đổi Mật Khẩu</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = {
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
    padding: 15,
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

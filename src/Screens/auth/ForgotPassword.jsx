// ForgotPassword.js
import React, {useState} from 'react';
import {View, TextInput, Button, Alert} from 'react-native';
import {auth} from '../../../firebaseConfig';  // Import từ firebaseConfig của bạn
import authRN from '@react-native-firebase/auth';  // Dùng @react-native-firebase/auth

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    authRN()
      .sendPasswordResetEmail(email)
      .then(() => {
        Alert.alert('Thành công', 'Email đặt lại mật khẩu đã được gửi.');
      })
      .catch((error) => {
        Alert.alert('Lỗi', error.message);
      });
  };

  return (
    <View style={{padding: 20}}>
      <TextInput
        placeholder="Nhập email của bạn"
        value={email}
        onChangeText={setEmail}
        style={{height: 40, borderBottomWidth: 1, marginBottom: 20}}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Gửi yêu cầu đặt lại mật khẩu" onPress={handleResetPassword} />
    </View>
  );
};

export default ForgotPassword;

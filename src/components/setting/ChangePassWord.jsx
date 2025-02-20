import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

const ChangePasswordScreen = (props) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');

      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      console.log(credential);
      await user.reauthenticateWithCredential(credential);

      await user.updatePassword(newPassword);
      Alert.alert('Thành công', 'Mật khẩu đã được đổi.');
      props.navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Mật khẩu hiện tại"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />
      <Button title="Đổi mật khẩu" onPress={handleChangePassword} />
    </View>
  );
};

export default ChangePasswordScreen;

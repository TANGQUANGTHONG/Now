import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Modal, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const DeleteAccountScreen = () => {
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập.');

      // Xác thực lại người dùng
      const credential = auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(credential);

      // Xóa dữ liệu trong Realtime Database
      await database().ref(`/users/${user.uid}`).remove();

      // Xóa tài khoản
      await user.delete();

      Alert.alert('Thành công', 'Tài khoản và dữ liệu đã bị xóa.');

      // Đóng modal
      setModalVisible(false);

      // Điều hướng về màn hình đăng nhập (tuỳ vào ứng dụng của bạn)
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Nút mở dialog */}
      <Button title="Xóa tài khoản" color="red" onPress={() => setModalVisible(true)} />

      {/* Dialog nhập mật khẩu */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: 300, backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Nhập mật khẩu</Text>

            <TextInput
              placeholder="Nhập mật khẩu để xác nhận"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ borderBottomWidth: 1, marginBottom: 20 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: 'blue' }}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeleteAccount} style={{ padding: 10 }}>
                <Text style={{ color: 'red' }}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeleteAccountScreen;

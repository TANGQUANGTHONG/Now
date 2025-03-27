import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const ConfirmDeleteScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);

  // Cấu hình Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '699479642304-kbe1s33gul6m5vk72i0ah7h8u5ri7me8.apps.googleusercontent.com',
    });
  }, []);

  const confirmDeletion = async () => {
    try {
      setLoading(true);
      let user = auth().currentUser;

      // Kiểm tra xem người dùng có đang đăng nhập không
      if (!user) {
        // Nếu không có người dùng, yêu cầu đăng nhập lại qua Google
        Alert.alert(
          'Session Expired',
          'Please log in again to confirm account deletion.',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const userInfo = await GoogleSignin.signIn();
                  const idToken = userInfo.data?.idToken || userInfo.idToken;
                  if (!idToken) throw new Error('No idToken from Google.');
                  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
                  await auth().signInWithCredential(googleCredential);
                  user = auth().currentUser; // Cập nhật lại user sau khi đăng nhập
                } catch (error) {
                  console.error('Login error:', error);
                  Alert.alert('Error', 'Failed to log in. Please try again.');
                  setLoading(false);
                  return;
                }
              },
            },
          ],
        );
      }

      if (!user) {
        setLoading(false);
        return; // Thoát nếu không thể đăng nhập lại
      }

      // Tải lại thông tin người dùng để kiểm tra trạng thái emailVerified
      await user.reload();
      const updatedUser = auth().currentUser;

      if (updatedUser.emailVerified) {
        // Email đã được xác minh, tiến hành cập nhật trạng thái tài khoản
        const userRef = database().ref(`users/${userId}`);
        await userRef.update({
          isActive: false, // Đặt trạng thái tài khoản thành false
          lastActive: database.ServerValue.TIMESTAMP,
        });

        // Xóa tài khoản khỏi Firebase Authentication
        await updatedUser.delete();
        Alert.alert('Success', 'Your account has been deleted successfully.');

        // Đăng xuất và chuyển hướng về màn hình đăng nhập
        await auth().signOut();
        navigation.reset({
          index: 0,
          routes: [{ name: 'UserNavigation' }],
        });
      } else {
        Alert.alert(
          'Verification Required',
          'Please verify your email before deleting your account.',
        );
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận xóa tài khoản:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Please verify your email to delete your account.
      </Text>
      <TouchableOpacity
        onPress={confirmDeletion}
        disabled={loading}
        style={{
          padding: 10,
          backgroundColor: loading ? 'gray' : 'red',
          borderRadius: 5,
        }}>
        <Text style={{ color: 'white', fontSize: 16 }}>
          {loading ? 'Processing...' : 'Confirm Delete'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmDeleteScreen;
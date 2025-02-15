import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert , StyleSheet} from 'react-native';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';

const SignUpWithPhone = (props) => {
  const { navigation } = props;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [confirmCode, setConfirmCode] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  const sendVerification = () => {
    signInWithPhoneNumber(auth, phoneNumber)
      .then((confirmationResult) => {
        setVerificationId(confirmationResult.verificationId);
        setConfirmCode(true); // Hiển thị input nhập mã xác minh
        Alert.alert('SMS gửi thành công', 'Nhập mã xác minh');
      })
      .catch((error) => {
        console.error("Error sending verification code:", error);
        Alert.alert('Lỗi', 'Không gửi được mã xác minh');
      });
  };

  const verifyCode = () => {
    const credential = auth.PhoneAuthProvider.credential(verificationId, verificationCode);
    auth.signInWithCredential(credential)
      .then((userCredential) => {
        const userId = userCredential.user.uid;

        // Lưu thông tin người dùng vào Firestore
        const userRef = doc(db, 'users', userId);
        setDoc(userRef, {
          phoneNumber: phoneNumber,
          userId: userId
        })
          .then(() => {
            Alert.alert("Người dùng được tạo và lưu vào Firestore");
            navigation.navigate('Login');
          })
          .catch((error) => {
            console.error("Lỗi lưu thông tin người dùng:", error);
            Alert.alert('Lỗi', 'Không thể lưu thông tin người dùng vào Firestore');
          });
      })
      .catch((error) => {
        console.error("Lỗi xác minh mã:", error);
        Alert.alert('Lỗi', 'Mã xác minh không đúng');
      });
  };

  return (
    <View>
      {!confirmCode ? (
        <View>
          <Text>Nhập số điện thoại của bạn</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Số điện thoại"
            placeholderTextColor={'black'}
            keyboardType="phone-pad"
            color= 'black'
          />
          <TouchableOpacity onPress={sendVerification}>
            <Text>Gửi mã xác minh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text>Nhập mã xác minh</Text>
          <TextInput
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="Mã xác minh"
            keyboardType="number-pad"
          />
          <TouchableOpacity onPress={verifyCode}>
            <Text>Xác minh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({

})
export default SignUpWithPhone;

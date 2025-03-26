import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConfirmDeleteScreen = ({route, navigation}) => {
  const {userId} = route.params;
  const [isVerified, setIsVerified] = useState(false); // Trạng thái xác minh

  const checkVerification = async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not logged in.');

      await user.reload(); // Cập nhật trạng thái người dùng
      setIsVerified(user.emailVerified); // Cập nhật trạng thái giao diện
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'An error occurred while checking verification.');
      return false;
    }
  };

  const confirmDelete = async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not logged in.');
  
      await user.reload(); // Cập nhật trạng thái người dùng
      if (user.emailVerified) {
        // Xóa tài khoản sau khi xác minh
        await database().ref(`/users/${user.uid}`).remove();
        await AsyncStorage.clear();
        await user.delete();
        console.log('The account has been automatically deleted.');
        Alert.alert('Success', 'The account and data have been deleted.');
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      } else {
        Alert.alert('Error', 'Please verify your email before deleting the account.');
      }
    } catch (error) {
      console.error('Error during account deletion:', error);
      Alert.alert('Error', 'An error occurred while deleting the account.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Please verify your email, then press the button below to delete your account.
      </Text>
      <Text style={styles.status}>
        Email verification status: {isVerified ? 'Verified' : 'Not Verified'}
      </Text>
      <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
        <Text style={styles.buttonText}>Confirm Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={checkVerification} style={styles.checkButton}>
        <Text style={styles.checkButtonText}>Check Verification</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ConfirmDeleteScreen;
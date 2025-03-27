import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';

const { width, height } = Dimensions.get('window');

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        Alert.alert('Success', 'The password reset email has been sent.');
        setEmail('');
      })
      .catch(error => {
        Alert.alert('Lỗi', error.message);
      });
  };

  return (
    <LinearGradient
      colors={['#438875', '#99F2C8']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#e4e2de"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            color = 'black'
          />

          <TouchableOpacity
            style={[
              styles.resetButton,
              { opacity: email ? 1 : 0.6 },
            ]}
            disabled={!email}
            onPress={handleResetPassword}
          >
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#f0f0f0',
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: width * 0.03,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.045,
    marginBottom: height * 0.03,
  },
  resetButton: {
    backgroundColor: '#002DE3',
    paddingVertical: height * 0.02,
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});

export default ForgotPassword;

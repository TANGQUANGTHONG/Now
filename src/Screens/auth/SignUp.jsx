import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {styles} from '../../Styles/auth/Sign_up';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignUp = ({navigation}) => {
  const [form, setForm] = useState({
    name: 'phong@gmail.com',
    email: 'phong@gmail.com',
    password: '123456',
    confirmPassword: '123456',
  });

  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});
  const defaultImage =
    'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg';

  const auth = getAuth();
  const db = getFirestore();

  const handleInputChange = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  const validateFields = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email address';
    if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateFields()) return;

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        form.email,
        form.password,
      );

      const userId = userCredential.user.uid;

      await firestore().collection('users').doc(userId).set({
        username: form.name,
        email: form.email,
        image: defaultImage,
      });

      console.log('User registered successfully!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>Sign up with Email</Text>
              <Text style={styles.subtitle}>
                Get chatting with friends and family today!
              </Text>

              {['name', 'email', 'password', 'confirmPassword'].map(field => (
                <View key={field} style={styles.inputContainer}>
                  <Text style={styles.validText}>
                    {field === 'confirmPassword'
                      ? 'Confirm Password'
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, errors[field] && styles.errorInput]}
                      value={form[field]}
                      onChangeText={value => handleInputChange(field, value)}
                      autoCapitalize="none"
                      placeholderTextColor={'#8C96A2'}
                      secureTextEntry={
                        (field === 'password' || field === 'confirmPassword') &&
                        secureText
                      }
                      keyboardType={
                        field === 'email' ? 'email-address' : 'default'
                      }
                      color="black"
                    />
                    {(field === 'password' || field === 'confirmPassword') && (
                      <TouchableOpacity
                        onPress={() => setSecureText(!secureText)}
                        style={styles.eyeIcon}>
                        <Icon
                          name={secureText ? 'eye-off' : 'eye'}
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {errors[field] && (
                    <Text style={styles.errorText}>{errors[field]}</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignUp}>
                <Text style={styles.loginText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

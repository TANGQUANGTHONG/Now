import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../firebaseConfig'; // Đảm bảo đã cấu hình Firebase
import Icon from 'react-native-vector-icons/Feather';
import { styles } from '../../Styles/Login_Sign_Up/Sign_up';
import { oStackHome } from '../../navigations/HomeNavigation';
import { auth } from '../../firebaseConfig';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextPassword, setSecureTextPassword] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [errors, setErrors] = useState({});


  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const validateConfirmPassword = (password, confirmPassword) => password === confirmPassword;


  const db = getFirestore(app);

  const validateFields = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!validateEmail(email.trim())) newErrors.email = 'Invalid email address';
    if (!validatePassword(password)) newErrors.password = 'Password must be at least 6 characters';
    if (!validateConfirmPassword(password, confirmPassword)) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateFields()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userId = userCredential.user.uid;

      // Lưu vào Firestore
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate(oStackHome.Login.name);
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      Alert.alert('Error', error.message);
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Sign up with Email</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>Your Name</Text>
          <TextInput 
            style={[styles.input, errors.name && styles.errorInput]} 
            value={name} 
            onChangeText={setName} 
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>Your Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.errorInput]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.errorInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextPassword}
            />
            <TouchableOpacity onPress={() => setSecureTextPassword(!secureTextPassword)} style={styles.eyeIcon}>
              <Icon name={secureTextPassword ? 'eye-off' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.validText}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.errorInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureTextConfirm}
            />
            <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)} style={styles.eyeIcon}>
              <Icon name={secureTextConfirm ? 'eye-off' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
          <Text style={styles.loginText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUp;

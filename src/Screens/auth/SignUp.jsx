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
import {styles} from '../../styles/auth/Sign_up';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';
import {getFirestore, doc, setDoc} from '@react-native-firebase/firestore';
import {encryptMessage} from '../../cryption/Encryption';

const SignUp = props => {
  const {navigation} = props;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({});
  const [Image] = useState('https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg');

  const auth = getAuth();
  const db = getFirestore();

  const Sign_Up = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const userId = userCredential.user.uid;
        const userRef = doc(db, 'users', userId);
        setDoc(userRef, {
          username: encryptMessage(name),
          email: encryptMessage(email),
          password: encryptMessage(password),
          Image: encryptMessage(Image),
        })
          .then(() => {
            Alert.alert('User created and saved to Firestore');
            navigation.navigate('Login');
          })
          .catch(error => {
            Alert.alert('Error saving user data to Firestore');
          });
      })
      .catch(() => {
        Alert.alert('Error creating user');
      });
  };

  const validateFields = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Invalid email address';
    if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

              <View style={styles.inputContainer}>
                <Text style={styles.validText}>Your Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.errorInput]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.validText}>Your email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.errorInput]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={'#8C96A2'}
                  color="black"
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
                    placeholderTextColor="gray"
                    secureTextEntry={secureText}
                    color="black"
                  />
                  <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeIcon}>
                    <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
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
                    placeholderTextColor={'#8C96A2'}
                    secureTextEntry={secureText}
                    color="black"
                  />
                  <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeIcon}>
                    <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => {
                  if (validateFields()) {
                    Sign_Up();
                    navigation.navigate('Login');
                  }
                }}>
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

import {auth} from './FireBaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Đăng ký tài khoản
const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log('User registered:', userCredential.user);
  } catch (error) {
    console.error('Error registering:', error.message);
  }
};

// Đăng nhập tài khoản
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log('User logged in:', userCredential.user);
  } catch (error) {
    console.error('Error logging in:', error.message);
  }
};

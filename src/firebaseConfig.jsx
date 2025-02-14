import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDLNErxqwSvANnexKbqNDE_9UnlH6i8WCo',
  authDomain: 'chatnow-cf271.firebaseapp.com',
  projectId: 'chatnow-cf271',
  storageBucket: 'chatnow-cf271.appspot.com',
  messagingSenderId: '233279697358',
  appId: 'chatnow-cf271',
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Auth với AsyncStorage để lưu phiên đăng nhập
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };

// FireBaseConfig.jsx
import { getApp, initializeApp } from '@react-native-firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCNIVWhoJB9gVqV09F_juJXmOVg2RJB940',
  authDomain: 'nowchat-6ba61.firebaseapp.com',
  projectId: 'nowchat-6ba61',
  storageBucket: 'nowchat-6ba61.appspot.com',
  messagingSenderId: '462017273323',
  appId: '1:462017273323:web:47d8e5e75f2be782becdae',
  measurementId: 'G-L0044B23WT',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {auth, db, app};

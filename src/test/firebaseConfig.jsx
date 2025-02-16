import {getApp, initializeApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import {getFirestore} from '@react-native-firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNIVWhoJB9gVqV09F_juJXmOVg2RJB940',
  authDomain: 'nowchat-6ba61.firebaseapp.com',
  projectId: 'nowchat-6ba61',
  storageBucket: 'nowchat-6ba61.appspot.com',
  messagingSenderId: '462017273323',
  appId: '1:462017273323:web:47d8e5e75f2be782becdae',
  measurementId: 'G-L0044B23WT',
};

let app;
try {
  app = getApp();
} catch (error) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const firestore = getFirestore(app);

export {auth, firestore};

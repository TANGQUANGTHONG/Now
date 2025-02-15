// src/fireBase/firebaseConfig.js

import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';

// Cấu hình Firebase từ file cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: 'AIzaSyA2olnE2mUxECHtV3hJsl7use9WnAbZ0WQ',
  authDomain: 'appchatnow.firebaseapp.com',
  projectId: 'appchatnow',
  storageBucket: 'appchatnow.appspot.com',
  messagingSenderId: '699479642304',
  appId: '1:699479642304:android:5902f8693cb413e4ad1d25',
};

// Khởi tạo ứng dụng Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Lấy Firestore từ ứng dụng Firebase
const firestoreDb = getFirestore(firebaseApp);

export {firestoreDb};

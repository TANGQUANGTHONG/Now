import messaging from '@react-native-firebase/messaging';
import {getDatabase, ref, set} from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted.');
  }
};

const saveTokenToDatabase = async token => {
  const userId = auth().currentUser?.uid;
  if (!userId) return;

  const db = getDatabase();
  await set(ref(db, `users/${userId}/fcmToken`), token);
};

export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    await saveTokenToDatabase(token);
  } catch (error) {
    console.error('Lỗi khi lấy FCM Token:', error);
  }
};

useEffect(() => {
  requestUserPermission();
  getFCMToken();
}, []);

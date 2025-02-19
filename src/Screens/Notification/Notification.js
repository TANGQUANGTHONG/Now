import messaging from '@react-native-firebase/messaging';
import {Alert} from 'react-native';
import {useEffect} from 'react';

const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Quyền thông báo được cấp.');
  } else {
    console.log('Người dùng từ chối quyền thông báo.');
  }
};

const NotificationHandler = () => {
  useEffect(() => {
    requestUserPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('Thông báo mới!', JSON.stringify(remoteMessage.notification));
    });

    return unsubscribe;
  }, []);

  return null; // Không trả về text hoặc JSX trống
};

export default NotificationHandler;

import React, { useEffect } from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import messaging from '@react-native-firebase/messaging';
import NotificationHandler from './src/Screens/Notification/Notification';

const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
  } catch (error) {
    console.log('Lỗi khi lấy FCM Token:', error);
  }
};

const App = () => {
  useEffect(() => {
    getFCMToken();

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Người dùng mở app từ thông báo:', remoteMessage);
        }
      });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Thông báo khi chạy nền:', remoteMessage);
    });
  }, []);

  return (
   <>
      <NotificationHandler />
      <AppNavigation />
   </>
  );
};

export default App;

import React, {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigation from './src/navigations/AppNavigation';
import {
  configurePushNotification,
  listenForNewMessages,
} from './src/notification/Notification';

const App = () => {
  // Bật thông báo khi app khởi động
  useEffect(() => {
    configurePushNotification();
    listenForNewMessages();
  }, []);

  return (
    <>
      <AppNavigation />
    </>
  );
};

export default App;

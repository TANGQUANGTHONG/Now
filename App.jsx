import React, {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigation from './src/navigations/AppNavigation';
import {
  configurePushNotification,
  listenForNewMessages,
} from './src/notification/Notification';
import useListenForNewMessages from './src/listenForNewMessages/listenForNewMessages';

const App = () => {
  // Bật thông báo khi app khởi động
  // useListenForNewMessages(); 
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

import React, { useEffect, useState } from 'react';
import AppNavigation from './src/navigations/AppNavigation';

import { configurePushNotification, listenForNewMessages } from './src/notification/Notification';


const App = () => {
// yeu cau bat thong bao  
  useEffect(() => {
    configurePushNotification();
  }, []);
// push thong bao khi co tin nhan 
  listenForNewMessages()

  



  return (
   <>
      <AppNavigation />
      </>
        );
};

export default App;
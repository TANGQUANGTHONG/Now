import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import AppNavigation from './src/navigations/AppNavigation';
import HomeNavigation from './src/navigations/HomeNavigation';
import {
  configurePushNotification,
  listenForNewMessages,
} from './src/notification/Notification';
import {getCurrentUserFromStorage} from './src/storage/Storage';

const App = () => {
  const [isConnected, setIsConnected] = useState(true); // Trạng thái mạng

  // Lắng nghe sự thay đổi trạng thái mạng
  useEffect(() => {
    configurePushNotification();
    listenForNewMessages();

    const getUser = async () => {
      const userId = await getCurrentUserFromStorage();
      return userId;
    };

    const unsubscribe = NetInfo.addEventListener(state => {
      if (getUser === '' || getUser == null) return;
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    return (
      <NavigationContainer>
        <HomeNavigation />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigation />
    </NavigationContainer>
  );
};

export default App;

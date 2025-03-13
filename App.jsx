import React, {useEffect, useState} from 'react';
import {getAuth} from '@react-native-firebase/auth';
import AppNavigation from './src/navigations/AppNavigation';
import {NavigationContainer} from '@react-navigation/native'; // Import NavigationContainer
import {
  configurePushNotification,
  listenForNewMessages,
} from './src/notification/Notification';
import HomeNavigation from './src/navigations/HomeNavigation';
import {getCurrentUserFromStorage} from './src/storage/Storage';

const App = () => {
  // Bật thông báo khi app khởi động
  useEffect(() => {
    configurePushNotification();
    listenForNewMessages();
  }, []);

  const auth = getAuth();

  const [myId, setMyid] = useState(null);

  const getUser = async () => {
    const user = await getCurrentUserFromStorage();
    setMyid(user.uid);
  };

  useEffect(() => {
    if (auth.currentUser?.uid !== null) {
      setMyid(auth.currentUser?.uid);
    } else {
      getUser();
    }
  }, []);

  return (
    <NavigationContainer>
      {myId !== null ? <AppNavigation /> : <HomeNavigation />}
    </NavigationContainer>
  );
};

export default App;

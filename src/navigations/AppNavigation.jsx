import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';
import DashBoard from '../Screens/auth/DashBoard';
import Splash from '../Screens/auth/Splash';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        console.log('User đăng nhập:', user.email);
        await checkEmailVerification(user);
      } else {
        console.log('Không có user đăng nhập');
        setIsEmailVerified(null);
      }
      setInitializing(false);
    });

    return subscriber;
  }, []);

  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
  };

  if (initializing) return null;

  // Hiển thị Splash Screen trước
  if (isSplashVisible) {
    return <Splash />;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <UserNavigation />
      ) : isEmailVerified === false ? (
        <DashBoard checkEmailVerification={() => checkEmailVerification(user)} />
      ) : (
        <HomeNavigation />
      )}
    </NavigationContainer>
  );
};

export default AppNavigation;

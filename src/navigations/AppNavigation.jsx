import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';
import DashBoard from '../Screens/auth/DashBoard';
import Splash from '../Screens/auth/Splash';
import {
  getCurrentUserFromStorage,
  saveCurrentUserAsyncStorage,
} from '../storage/Storage';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);

  // Hiển thị Splash Screen trong 2 giây
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Theo dõi thay đổi trạng thái người dùng đăng nhập
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async user => {
      if (user) {
        console.log('User đăng nhập:', user.email);
        await saveCurrentUserAsyncStorage();
        await checkEmailVerification(user);
      } else {
        console.log('Không có user đăng nhập');
        console.log(storedUser);
        setIsEmailVerified(null);
      }
      setInitializing(false);
    });

    return subscriber; // Cleanup khi component unmount
  }, []);

  const checkEmailVerification = async user => {
    await user.reload(); // Reload thông tin người dùng từ Firebase
    setIsEmailVerified(user.emailVerified);
  };

  if (initializing) return null; // Trả về null trong khi đang khởi tạo

  // Hiển thị Splash Screen nếu có
  if (isSplashVisible) {
    return <Splash />;
  }

  // Điều hướng dựa trên trạng thái người dùng
  // console.log('>>>>>>>>>', user);
  return (
    <NavigationContainer>
      {!user ? (
        <UserNavigation />
      ) : isEmailVerified === false ? (
        <DashBoard
          checkEmailVerification={() => checkEmailVerification(user)}
        />
      ) : (
        <HomeNavigation />
      )}
    </NavigationContainer>
  );
};

export default AppNavigation;

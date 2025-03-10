import React, { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database'; // Sử dụng Firebase Database

import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';
import DashBoard from '../Screens/auth/DashBoard';
import Splash from '../Screens/auth/Splash';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Theo dõi trạng thái ứng dụng
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App is active - Cập nhật trạng thái hoạt động');
        updateUserStatus('online'); // Cập nhật "đang hoạt động"
      }

      if (nextAppState.match(/background/)) {
        console.log('App is in background - Cập nhật trạng thái không hoạt động');
        updateUserStatus('offline'); // Cập nhật "không hoạt động"
      }

      setAppState(nextAppState);
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [appState]);

  // Đăng ký sự thay đổi trạng thái đăng nhập
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        console.log('User đăng nhập:', user.email);
        await checkEmailVerification(user);
        updateUserStatus('online'); // Khi user vào app, cập nhật trạng thái "online"
      } else {
        console.log('Không có user đăng nhập');
        setIsEmailVerified(null);
      }
      setInitializing(false);
    });

    return subscriber;
  }, []);

  // Hàm kiểm tra và cập nhật email
  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
  };

  // Cập nhật trạng thái hoạt động của user trong Firebase
  const updateUserStatus = async (status) => {
    const userId = auth().currentUser?.uid;
    if (userId) {
      const userStatusRef = database().ref(`/users/${userId}/status`);
      await userStatusRef.set({
        status,
        lastActive: status === 'offline' ? Date.now() : null,
      });
    }
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

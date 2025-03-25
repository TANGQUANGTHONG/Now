import React, { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';
import DashBoard from '../Screens/auth/DashBoard';
import Splash from '../Screens/auth/Splash';
import { AppState } from 'react-native';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [previousUserId, setPreviousUserId] = useState(null); // Lưu userId của tài khoản trước đó

  // Hàm cập nhật trạng thái online/offline
  const updateUserStatus = async (userId, isOnline) => {
    if (!userId) return;
    try {
      await database()
        .ref(`/users/${userId}`)
        .update({
          isOnline: isOnline,
          lastActive: database.ServerValue.TIMESTAMP,
        });
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Xử lý khi app chuyển trạng thái (foreground/background/terminated)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (user) {
        if (nextAppState === 'active') {
          updateUserStatus(user.uid, true);
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          updateUserStatus(user.uid, false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User đăng nhập:', user.email);
        // Nếu có tài khoản trước đó, đặt trạng thái offline cho tài khoản đó
        if (previousUserId && previousUserId !== user.uid) {
          await updateUserStatus(previousUserId, false);
        }
        // Đặt trạng thái online cho tài khoản hiện tại
        await updateUserStatus(user.uid, true);
        await checkEmailVerification(user);
        setPreviousUserId(user.uid); // Cập nhật userId của tài khoản hiện tại
      } else {
        console.log('Không có user đăng nhập');
        // Khi đăng xuất, đặt trạng thái offline cho tài khoản trước đó
        if (previousUserId) {
          await updateUserStatus(previousUserId, false);
        }
        setPreviousUserId(null); // Xóa userId của tài khoản trước đó
        setIsEmailVerified(null);
      }
      setUser(user);
      setInitializing(false);
    });

    return subscriber;
  }, [previousUserId]); // Thêm previousUserId vào dependency để đảm bảo logic chạy lại khi userId thay đổi

  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
  };

  if (initializing) return null;

  if (isSplashVisible) {
    return <Splash />;
  }

  return (
    <>
      {!user ? (
        <UserNavigation />
      ) : isEmailVerified === false ? (
        <DashBoard
          checkEmailVerification={() => checkEmailVerification(user)}
        />
      ) : (
        <HomeNavigation />
      )}
    </>
  );
};

export default AppNavigation;
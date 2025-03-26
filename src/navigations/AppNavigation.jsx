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
  const [isCompleteNickname, setIsCompleteNickname] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);

  // Cập nhật trạng thái người dùng trong database
  const updateUserStatus = async (userId, isOnline) => {
    if (!userId) return;
    try {
      await database()
        .ref(`/users/${userId}`)
        .update({
          isOnline,
          lastActive: isOnline ? database.ServerValue.TIMESTAMP : null, // Chỉ cập nhật lastActive khi online
        });
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Xử lý trạng thái ứng dụng (active, background, inactive)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (!user || isCompleteNickname !== true) return; // Không cập nhật nếu user không hợp lệ
      const isOnline = nextAppState === 'active';
      updateUserStatus(user.uid, isOnline);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, isCompleteNickname]);

  // Hiển thị Splash trong 2 giây khi khởi động
  useEffect(() => {
    const timeout = setTimeout(() => setSplashVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Lắng nghe trạng thái xác thực
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      console.log(
        'Auth state changed:',
        currentUser ? `User logged in: ${currentUser.email}` : 'No user logged in'
      );

      if (currentUser) {
        // Khi đăng nhập: Set trạng thái online ngay lập tức
        await Promise.all([
          checkEmailVerification(currentUser),
          checkNicknameStatus(currentUser.uid),
          updateUserStatus(currentUser.uid, true), // Khởi tạo trạng thái online
        ]);
      } else {
        // Khi đăng xuất: Set trạng thái offline cho user trước đó (nếu có)
        if (user?.uid) {
          await updateUserStatus(user.uid, false);
        }
      }

      setUser(currentUser);
      setInitializing(false);
    });

    return subscriber;
  }, [user?.uid]); // Chỉ chạy lại nếu uid thay đổi

  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
    console.log('Email verified:', user.emailVerified);
  };

  const checkNicknameStatus = async (userId) => {
    try {
      const userRef = database().ref(`/users/${userId}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      setIsCompleteNickname(userData.isCompleteNickname || false);
      console.log('isCompleteNickname:', userData.isCompleteNickname || false);
    } catch (error) {
      console.error('Error checking nickname status:', error);
      setIsCompleteNickname(false);
    }
  };

  if (initializing) return null;
  if (isSplashVisible) return <Splash />;

  // Chờ dữ liệu cần thiết trước khi điều hướng
  if (user && (isCompleteNickname === null || isEmailVerified === null)) {
    return <Splash />;
  }

  return (
    <>
      {!user || isCompleteNickname === false ? (
        <UserNavigation />
      ) : isEmailVerified === false ? (
        <DashBoard checkEmailVerification={() => checkEmailVerification(user)} />
      ) : (
        <HomeNavigation />
      )}
    </>
  );
};

export default AppNavigation;
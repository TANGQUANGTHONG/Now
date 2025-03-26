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
  const [previousUserId, setPreviousUserId] = useState(null);

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

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (user && isCompleteNickname === true) {
        if (nextAppState === 'active') {
          updateUserStatus(user.uid, true);
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          updateUserStatus(user.uid, false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, isCompleteNickname]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user logged in');
      if (user) {
        if (previousUserId && previousUserId !== user.uid) {
          await updateUserStatus(previousUserId, false);
        }
        // Chờ cả hai hàm bất đồng bộ hoàn tất trước khi cập nhật trạng thái
        await Promise.all([
          checkEmailVerification(user),
          checkNicknameStatus(user.uid),
        ]);
        setPreviousUserId(user.uid);
      } else {
        if (previousUserId) {
          await updateUserStatus(previousUserId, false);
        }
        setPreviousUserId(null);
        setIsEmailVerified(null);
        setIsCompleteNickname(null);
      }
      setUser(user);
      setInitializing(false);
    });

    return subscriber;
  }, [previousUserId]);

  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
    console.log('Email verified:', user.emailVerified);
  };

  const checkNicknameStatus = async (userId) => {
    try {
      const userRef = database().ref(`/users/${userId}`);
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setIsCompleteNickname(userData.isCompleteNickname || false);
        console.log('isCompleteNickname:', userData.isCompleteNickname || false);
      } else {
        setIsCompleteNickname(false);
      }
    } catch (error) {
      console.error('Error checking nickname status:', error);
      setIsCompleteNickname(false);
    }
  };

  if (initializing) return null;

  if (isSplashVisible) {
    return <Splash />;
  }

  // Xử lý trạng thái trung gian khi isCompleteNickname hoặc isEmailVerified vẫn là null
  if (user && (isCompleteNickname === null || isEmailVerified === null)) {
    return <Splash />; // Hiển thị Splash trong khi chờ dữ liệu
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
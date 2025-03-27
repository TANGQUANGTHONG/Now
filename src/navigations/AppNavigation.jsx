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
  const [isCompleteNickname, setIsCompleteNickname] = useState(null); // Thêm state mới
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [previousUserId, setPreviousUserId] = useState(null);

  const updateUserStatus = async (userId, isOnline) => {
    if (!userId) return;
    try {
      const userRef = database().ref(`/users/${userId}`);
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
        const updates = { isOnline };
        if (isOnline) {
          updates.lastActive = database.ServerValue.TIMESTAMP;
        }
        await userRef.update(updates);
        console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      } else {
        console.log(`User ${userId} does not exist. Skipping status update.`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

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
    return () => subscription.remove();
  }, [user]);

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
          // Kiểm tra xem previousUserId có còn tồn tại trong database không
          const previousUserRef = database().ref(`/users/${previousUserId}`);
          const previousSnapshot = await previousUserRef.once('value');
          if (previousSnapshot.exists()) {
            await updateUserStatus(previousUserId, false);
          } else {
            console.log(`Previous user ${previousUserId} no longer exists. Skipping status update.`);
          }
        }
  
        const userRef = database().ref(`/users/${user.uid}`);
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
          await updateUserStatus(user.uid, true);
        } else {
          console.log(`User ${user.uid} does not exist in database yet. Skipping status update.`);
        }
  
        await checkEmailVerification(user);
        await checkNicknameStatus(user.uid);
        setPreviousUserId(user.uid);
      } else {
        if (previousUserId) {
          // Kiểm tra xem previousUserId có còn tồn tại trong database không
          const previousUserRef = database().ref(`/users/${previousUserId}`);
          const previousSnapshot = await previousUserRef.once('value');
          if (previousSnapshot.exists()) {
            await updateUserStatus(previousUserId, false);
          } else {
            console.log(`Previous user ${previousUserId} no longer exists. Skipping status update.`);
          }
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


  return (
    <>
      {!user || isCompleteNickname === false ? (
        <UserNavigation /> // Nếu chưa có nickname, giữ ở UserNavigation
      ) : isEmailVerified === false ? (
        <DashBoard checkEmailVerification={() => checkEmailVerification(user)} />
      ) : (
        <HomeNavigation />
      )}
    </>
  );
};

export default AppNavigation;
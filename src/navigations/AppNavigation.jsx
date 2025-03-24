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
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false); // Thêm trạng thái để kiểm tra Google Sign-in

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
      setUser(user);
      if (user) {
        console.log('User đăng nhập:', user.email);
        await updateUserStatus(user.uid, true);

        // Kiểm tra xem tài khoản có sử dụng Google Sign-in không
        const providerData = user.providerData;
        const isGoogle = providerData.some(provider => provider.providerId === 'google.com');
        setIsGoogleSignIn(isGoogle);

        await checkEmailVerification(user);
        await checkProfileCompletion(user);
      } else {
        console.log('Không có user đăng nhập');
        if (user) {
          await updateUserStatus(user.uid, false);
        }
        setIsEmailVerified(null);
        setIsProfileComplete(false);
        setIsGoogleSignIn(false);
      }
      setInitializing(false);
    });

    return subscriber;
  }, []);

  const checkEmailVerification = async (user) => {
    await user.reload();
    setIsEmailVerified(user.emailVerified);
  };

  const checkProfileCompletion = async (user) => {
    try {
      const userRef = database().ref(`/users/${user.uid}`);
      const snapshot = await userRef.once('value');
      if (snapshot.exists() && snapshot.val().nickname) {
        setIsProfileComplete(true);
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    }
  };

  if (initializing) return null;

  if (isSplashVisible) {
    return <Splash />;
  }

  return (
    <>
      {!user ? (
        <UserNavigation />
      ) : !isEmailVerified && !isGoogleSignIn ? ( // Bỏ qua xác minh email nếu là Google Sign-in
        <DashBoard checkEmailVerification={() => checkEmailVerification(user)} />
      ) : !isProfileComplete ? (
        <UserNavigation />
      ) : (
        <HomeNavigation />
      )}
    </>
  );
};

export default AppNavigation;
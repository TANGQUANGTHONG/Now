import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';
import DashBoard from '../Screens/auth/DashBoard';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(null); // Trạng thái ban đầu là null

  // Lắng nghe trạng thái người dùng
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        await checkEmailVerification(user);
      } else {
        setIsEmailVerified(null);
      }
      setInitializing(false);
    });

    return subscriber;
  }, []);

  // Kiểm tra trạng thái xác thực email
  const checkEmailVerification = async (user) => {
    await user.reload(); // Cập nhật trạng thái email từ Firebase
    setIsEmailVerified(user.emailVerified);
  };

  // Nếu đang khởi tạo, không hiển thị UI
  if (initializing) return null;

  return (
    <NavigationContainer>
      {!user ? (
        <UserNavigation />
      ) : isEmailVerified === false ? ( // Tránh nhấp nháy do trạng thái `null`
        <DashBoard checkEmailVerification={() => checkEmailVerification(user)} />
      ) : (
        <HomeNavigation />
      )}
    </NavigationContainer>
  );
};

export default AppNavigation;

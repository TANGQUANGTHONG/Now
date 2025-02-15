import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';

import HomeNavigation from './HomeNavigation';
import UserNavigation from './UserNavigation';

const AppNavigation = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const auth = getAuth();
  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;
  return (
    <NavigationContainer>
      {user ? <HomeNavigation /> : <UserNavigation />}
    </NavigationContainer>
  );
};

export default AppNavigation;

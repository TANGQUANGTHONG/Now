import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import Login from '../Screens/auth/Login';
import Splash from '../Screens/auth/Splash';
import Boarding from '../Screens/auth/Boarding';
import SignUp from '../Screens/auth/SignUp';
import ForgotPassword from '../Screens/auth/ForgotPassword';
const UserNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Boarding">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Boarding" component={Boarding} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

export default UserNavigation;

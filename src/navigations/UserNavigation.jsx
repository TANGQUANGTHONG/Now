import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import Login from '../Screens/auth/Login';
import Splash from '../Screens/auth/Splash';
import Boarding from '../Screens/auth/Boarding';
import SignUp from '../Screens/auth/SignUp';
import Chat from '../Screens/Chat';
import Profile from '../Screens/Profile';
import Single from '../Screens/chat/Single';
import Group from '../Screens/chat/Group';
import Search from '../Screens/search/Search';
import {TabHome} from '../navigations/HomeNavigation';

const UserNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Boarding">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Boarding" component={Boarding} />
      <Stack.Screen name="TabHome" component={TabHome} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Single" component={Single} />
      <Stack.Screen name="Group" component={Group} />
      <Stack.Screen name="Search" component={Search} />
    </Stack.Navigator>
  );
};

export default UserNavigation;

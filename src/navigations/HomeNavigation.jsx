import React from 'react'
import Icon from 'react-native-vector-icons/FontAwesome';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import màn hình
import Home from '../Screens/Home';
import Contact from '../Screens/Contact';
import Setting from '../Screens/Setting';
import Chat from '../Screens/Chat';

// Danh sách tab
const oTab = {
  Home: { name: 'Home', component: Home, icon: "home" },
  Contact: { name: 'Contact', component: Contact, icon: "user-circle-o" },
  Setting: { name: 'Setting', component: Setting, icon: "gear" }
};

const Tab = createBottomTabNavigator();

const TabHome = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const item = Object.values(oTab).find(tab => tab.name === route.name);
          return item ? <Icon name={item.icon} size={size} color={focused ? "#121212" : "gray"} /> : null;
        },
        headerShown: false,
        tabBarActiveTintColor: '#D17842',
        tabBarHideOnKeyboard: true,
      })}
    >
      {Object.values(oTab).map((item, index) => (
        <Tab.Screen key={index} name={item.name} component={item.component} options={{ title: "" }} />
      ))}
    </Tab.Navigator>
  );
};

// Danh sách Stack Home

import Profile from '../Screens/Profile';
const oStackHome = {
  TabHome: { name: 'TabHome', component: TabHome },
  Chat: { name: 'Chat', component: Chat },
  Profile: {name: 'Profile', component: Profile}

};

const StackHome = createNativeStackNavigator();

const HomeNavigation = () => {
  return (
    <StackHome.Navigator screenOptions={{ headerShown: false }} initialRouteName="TabHome">
      {Object.values(oStackHome).map((item, index) => (
        <StackHome.Screen key={index} name={item.name} component={item.component} />
      ))}
    </StackHome.Navigator>
  );
};

export { oTab, oStackHome };
export default HomeNavigation;

import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import màn hình
import Home from '../Screens/home/Home';
import Contact from '../Screens/Contact';
import Setting from '../Screens/Setting';
import Chat from '../Screens/Chat';
import Single from '../Screens/chat/Single';
import Group from '../Screens/chat/Group';
import Search from '../Screens/search/Search';
import Login from '../Screens/auth/Login';

// Danh sách tab
const oTab = {
  Home: {
    name: 'Home',
    component: Home,
    icon: 'chatbubble-ellipses-outline',
    name: 'Message',
  },
  Contact: {
    name: 'Contact',
    component: Contact,
    icon: 'person-circle',
    name: 'Contacts',
  },
  Setting: {
    name: 'Setting',
    component: Setting,
    icon: 'settings',
    name: 'Setting',
  },
};

const Tab = createBottomTabNavigator();

const TabHome = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          const item = Object.values(oTab).find(tab => tab.name === route.name);
          return item ? (
            <Icon
              name={item.icon}
              size={size}
              color={focused ? '#24786D' : 'gray'}
              style={{fontWeight: focused ? 'bold' : 'normal'}}
            />
          ) : null;
        },
        headerShown: false,
        tabBarActiveTintColor: '#24786D',
        tabBarInactiveTintColor: 'gray',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarStyle: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
      })}>
      {Object.values(oTab).map((item, index) => (
        <Tab.Screen
          key={index}
          name={item.name}
          component={item.component}
          options={{title: item.name}}
        />
      ))}
    </Tab.Navigator>
  );
};

// Danh sách Stack Home

import Profile from '../Screens/Profile';
const oStackHome = {
  TabHome: {name: 'TabHome', component: TabHome},
  Chat: {name: 'Chat', component: Chat},
  Profile: {name: 'Profile', component: Profile},
  Single: {name: 'Single', component: Single},
  Group: {name: 'Group', component: Group},
  Search: {name: 'Search', component: Search},
  Login: {name: 'Login', component: Login},
};

const StackHome = createNativeStackNavigator();

const HomeNavigation = () => {
  return (
    <StackHome.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Splash">
      {Object.values(oStackHome).map((item, index) => (
        <StackHome.Screen
          key={index}
          name={item.name}
          component={item.component}
        />
      ))}
    </StackHome.Navigator>
  );
};

export {oTab, oStackHome};
export default HomeNavigation;

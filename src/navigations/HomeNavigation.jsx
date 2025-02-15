import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import màn hình
import Home from '../Screens/home/Home';
import Setting from '../Screens/Setting';
import Chat from '../Screens/chat/Single';
import Single from '../Screens/chat/Single';
import Group from '../Screens/chat/Group';
import Search from '../Screens/search/Search';
import Login from '../Screens/auth/Login';
import Profile from '../Screens/Profile';

// Tạo Bottom Tab
const Tab = createBottomTabNavigator();

const TabHome = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          if (route.name === 'Home') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'Setting') iconName = 'settings';

          return iconName ? (
            <Icon
              name={iconName}
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
      <Tab.Screen name="Home" component={Home} options={{title: 'Home'}} />
      <Tab.Screen
        name="Setting"
        component={Setting}
        options={{title: 'Setting'}}
      />
    </Tab.Navigator>
  );
};

// Tạo Stack Navigator
const StackHome = createNativeStackNavigator();

const HomeNavigation = () => {
  return (
    <StackHome.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Login">
      <StackHome.Screen name="Login" component={Login} />
      <StackHome.Screen name="TabHome" component={TabHome} />
      <StackHome.Screen name="Chat" component={Chat} />
      <StackHome.Screen name="Profile" component={Profile} />
      <StackHome.Screen name="Single" component={Single} />
      <StackHome.Screen name="Group" component={Group} />
      <StackHome.Screen name="Search" component={Search} />
    </StackHome.Navigator>
  );
};

export {HomeNavigation, TabHome};

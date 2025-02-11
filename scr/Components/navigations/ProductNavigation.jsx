import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';


import Home from '../Products/HomeScreen';
import Notification from '../Products/Notifications';
import HomeScreen from '../Products/HomeScreen';
import Find_music from '../Products/Find_music';
import Library from '../Products/Library';
import Profile from '../Products/Profile';
import MusicPlayer from '../Products/MusicPlayer';
import Favorites from '../Products/Favorites';
import MusicList from '../Products/MusicList';



// const StackProfile = createNativeStackNavigator();
// const ProfileNavigation = () => {
//   return (
//     <StackProfile.Navigator screenOptions={{ headerShown: false }} initialRouteName='Profile'>
//       {/* <StackProfile.Screen name="Profile" component={Profile} /> */}
//       {/* <StackProfile.Screen name="QandA" component={QandA} />
//       <StackProfile.Screen name="EditProfile" component={EditProfile} /> */}
//     </StackProfile.Navigator>
//   )
// }

const Tab = createBottomTabNavigator();
const TabHome = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} initialRouteName='Home'>
        <Tab.Screen
      name="Home"
      component={Home}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../item/icon_home.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
      }}
    />
        <Tab.Screen
      name="Find_music"
      component={Find_music }
      options={{
        tabBarLabel: 'Find music',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../item/icon_find.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
      }}
    />

        <Tab.Screen
      name="Notification"
      component={Notification}
      options={{
        tabBarLabel: 'Updates',
        tabBarIcon: ({ color, size }) => (
          <Image
          source={require('../item/icon_notification.png')}
          style={{ width: size, height: size, tintColor: color }}
        />
        ),
      }}
    />
      <Tab.Screen
      name="Profile"
      component={Profile}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <Image
          source={require('../item/icon_profile.png')}
          style={{ width: size, height: size, tintColor: color }}
        />
        ),
      }}
    />
    </Tab.Navigator>
  )
}

const StackHome = createNativeStackNavigator();
const ProductNavigation = () => {
  return (
    <StackHome.Navigator screenOptions={{ headerShown: false }} initialRouteName='TabHome'>
      <StackHome.Screen name="TabHome" component={TabHome} />
      <StackHome.Screen name="HomeScreen" component={HomeScreen} />
      <StackHome.Screen name="Find_music" component={Find_music} />
      <StackHome.Screen name="Notification" component={Notification} />
      <StackHome.Screen name="Library" component={Library} />
      <StackHome.Screen name="Profile" component={Profile} />
      <StackHome.Screen name="MusicPlayer" component={MusicPlayer} />
      <StackHome.Screen name="MusicList" component={MusicList} />
      <StackHome.Screen name="Favorites" component={Favorites} />
  
    </StackHome.Navigator>
    
  )
}

export default ProductNavigation;

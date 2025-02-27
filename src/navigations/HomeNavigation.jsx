import React, {useEffect} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import màn hình
import Home from '../Screens/home/Home';
import Setting from '../Screens/Profile_Settings/Setting';
import Chat from '../Screens/chat/Single';
import Login from '../Screens/auth/Login';
import Single from '../Screens/chat/Single';
import Search from '../Screens/search/Search';
import ProfileView from '../Screens/Profile_Settings/ProfileView';
import ChangeDisplayName from '../components/setting/ChangeDisplayName';
import ChangePasswordScreen from '../components/setting/ChangePassWord';
import DeleteAccountScreen from '../components/setting/Deleted';
import Profile from '../Screens/Profile_Settings/Profile';
import Gemini from '../Screens/chat/germiniAI';

// Danh sách tab
const oTab = {
  Home: {
    name: 'Home',
    component: Home,
    icon: 'chatbox-ellipses',
    name: 'Message',
  },
  Profile: {
    name: 'Profile',
    component: Profile,
    icon: 'person',
    name: 'Profile',
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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const item = Object.values(oTab).find(tab => tab.name === route.name);
          return item ? (
            <Icon
              name={item.icon}
              size={size}
              color={focused ? '#99F2C8' : 'gray'}
              style={{ fontWeight: focused ? 'bold' : 'normal' }}
            />
          ) : null;
        },
        headerShown: false,
        tabBarActiveTintColor: '#99F2C8',
        // tabBarInactiveTintColor: 'gray',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarStyle: {
          backgroundColor: '#121212',
          height: 60,
          borderTopWidth: 0, // Loại bỏ đường kẻ xám
        },
      })}>
      {Object.values(oTab).map((item, index) => (
        <Tab.Screen
          key={index}
          name={item.name}
          component={item.component}
          options={{ title: item.name }}
        />
      ))}
    </Tab.Navigator>
  );
};

// Danh sách Stack Home


const oStackHome = {
  TabHome: {name: 'TabHome', component: TabHome},
  Chat: {name: 'Chat', component: Chat},
  Single: {name: 'Single', component: Single},
  Search: {name: 'Search', component: Search},
  Login: {name: 'Login', component: Login},
  ChangeDisplayName: {name: 'ChangeDisplayName', component: ChangeDisplayName},
  ChangePasswordScreen: {name: 'ChangePasswordScreen', component: ChangePasswordScreen},
  DeleteAccountScreen: {name: 'DeleteAccountScreen', component: DeleteAccountScreen},
  Gemini: {name: 'Gemini', component: Gemini},


};

const StackHome = createNativeStackNavigator();

const HomeNavigation = () => {
  // useEffect(() => {
  //   syncDataFromFirebase();
  //   getAllMessagesFromSQLite();
  // }, []);

  // const logAllMessages = () => {
  //   getAllMessagesFromSQLite(messages => {
  //     console.log(
  //       '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n \tDanh sách tất cả tin nhắn từ SQLite:',
  //     );
  //     console.log(JSON.stringify(messages, null, 2));
  //   });
  // };

  // Gọi hàm để log tin nhắn
  // logAllMessages();r

  return (
    <StackHome.Navigator
      screenOptions={{ headerShown: false }}>
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

export { oTab, oStackHome };
export default HomeNavigation;

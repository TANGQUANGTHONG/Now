import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import Login from '../Screens/Login_Sign_Up/Login';
import Sign_Up from '../Screens/Login_Sign_Up/Sign_up';
import ProductNavigation from './HomeNavigation';

const UserNavigation = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Login'>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Sign_Up" component={Sign_Up} />
            <Stack.Screen name="ProductNavigation" component={ProductNavigation} />
        </Stack.Navigator>
    )
}

export default UserNavigation
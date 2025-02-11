import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import Login from '../User/Login';
import Register from '../User/Register';
import ProductNavigation from './ProductNavigation';

const UserNavigation = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Login'>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ProductNavigation" component={ProductNavigation} />
        </Stack.Navigator>
    )
}

export default UserNavigation
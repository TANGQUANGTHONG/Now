import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import AuthScreen from './AuthScreen';
import ChatListScreen from './ChatListScreen';
import CreateGroupScreen from './CreateGroupScreen';
import ChatScreen from './ChatScreen';

const Stack = createStackNavigator();

export default function AppNavigationTest() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

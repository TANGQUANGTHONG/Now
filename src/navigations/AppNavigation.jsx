import React from 'react'
import { NavigationContainer } from '@react-navigation/native';

import UserNavigation from './UserNavigation';
import TabHome from './HomeNavigation';

const AppNavigation = () => {
  return (
    <NavigationContainer>
     
         <TabHome /> 
      
    </NavigationContainer>
  )
}

export default AppNavigation
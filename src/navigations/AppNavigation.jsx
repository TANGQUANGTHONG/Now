import React from 'react'
import { NavigationContainer } from '@react-navigation/native';


import TabHome from './HomeNavigation';

const AppNavigation = () => {
  return (
    <NavigationContainer>
     
         <TabHome /> 
      
    </NavigationContainer>
  )
}

export default AppNavigation
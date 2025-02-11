import React from 'react'
import { NavigationContainer } from '@react-navigation/native';


import HomeNavigation from './HomeNavigation';

const AppNavigation = () => {
  return (
    <NavigationContainer>
     
         <HomeNavigation /> 
      
    </NavigationContainer>
  )
}

export default AppNavigation
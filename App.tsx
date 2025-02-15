import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AppNavigation from './src/navigations/AppNavigation'

<<<<<<< HEAD
import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Home from './scr/Screens/Home/Home';
import Search from './scr/Screens/Search/Search';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Home />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});

export default App;
=======
const App = () => {
  return (
    <>
        <AppNavigation/>
    </>
  )
}

export default App

const styles = StyleSheet.create({})
>>>>>>> origin/Tai_Register_Firebase

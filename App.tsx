import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Single from './scr/Screens/Chat/Single'
import Group from './scr/Screens/Chat/Group'
const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <Single />
    </View>
  )
}

export default App

const styles = StyleSheet.create({})
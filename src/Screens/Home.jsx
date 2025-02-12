import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/FontAwesome';

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.colorText}>Hehe</Text>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignContent: 'center',
  },
  colorText:{
    color: 'black'
  }

})
import {View, StyleSheet, Image, Dimensions} from 'react-native';
import React, { useEffect } from 'react';

const {width, height} = Dimensions.get('window')

const Splash = (props) => {
    const {navigation} = props

    useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Boarding'); 
    }, 2000);

    return () => clearTimeout(timeout); 
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../auth/assets/logo/logo-uihut.png')}
      />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: width * 0.25 ,
    height: width * 0.2,
  },
});
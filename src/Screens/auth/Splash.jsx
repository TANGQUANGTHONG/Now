import {View, StyleSheet, Image} from 'react-native';
import React, { useEffect } from 'react';

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
    width: 154,
    height: 123,
  },
});
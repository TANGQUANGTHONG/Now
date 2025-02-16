import {View, StyleSheet, Image, Dimensions} from 'react-native';
import React, { useEffect } from 'react';
import {
  getAuth,
} from '@react-native-firebase/auth';
const {width, height} = Dimensions.get('window')

const Splash = (props) => {
    const {navigation} = props
    const auth = getAuth()
    useEffect(() => {
      const timeout = setTimeout(() => {
        const user = auth.currentUser;
        if (user) {
          // Nếu người dùng đã đăng nhập, điều hướng đến HomeNavigation
          navigation.replace('Home');
        } else {
          // Nếu chưa đăng nhập, điều hướng đến Boarding hoặc Login
          navigation.replace('Boarding'); // hoặc 'Login' nếu muốn
        }
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
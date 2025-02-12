import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import React from 'react';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../../assets/images/logo/logo-uihut2.png')}
      />
      <Image
        style={styles.image1}
        source={require('../../assets/images/background/ellipse-background.png')}
      />
      <Text style={styles.textHeader}>Connect friends easily & quickly</Text>
      <Text style={styles.text}>
        Our chat app is the perfect way to stay connected with friends and
        family.
      </Text>
      <View style={styles.iconContainer}>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../../assets/images/icon/icon_facebook.png')}
          />
        </View>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../../assets/images/icon/icon_google.png')}
          />
        </View>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../../assets/images/icon/icon_apple.png')}
          />
        </View>
      </View>
      <View style={styles.orContainer}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>
      <TouchableOpacity style={styles.signUpButton}>
        <Text style={styles.signUpText}>Sign up with mail</Text>
      </TouchableOpacity>
      <Text style={styles.existingAccount}>
        Existing account? <Text style={styles.loginText}>Log in</Text>
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'black',
    gap: 20,
  },
  image: {
    width: 77,
    height: 20,
    marginTop: 27,
    position: 'absolute',
    zIndex: 2,
  },
  image1: {
    width: 577,
    top: -300,
    position: 'absolute',
    zIndex: 0,
  },
  textHeader: {
    fontSize: 68,
    fontWeight: 'bold',
    color: 'white',
    width: '80%',
    marginTop: 46,
  },
  text: {
    fontSize: 18,
    fontWeight: '400',
    color: '#B9C1BE',
    width: '80%',
    marginTop: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 999,
    width: 48,
    height: 48,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  orLine: {
    width: '30%',
    height: 1,
    backgroundColor: '#CDD1D0',
  },
  orText: {
    fontSize: 18,
    color: 'white',
  },
  signUpButton: {
    height: 48,
    width: 327,
    borderRadius: 16,
    backgroundColor: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#000E08',
    textAlign: 'center',
  },
  existingAccount: {
    color: '#B9C1BE',
    fontSize: 14,
  },
  loginText: {
    color: 'white',
  },
});

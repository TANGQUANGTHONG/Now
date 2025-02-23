import { StyleSheet, Text, View, Image, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';  // Import MaskedView
const { width, height } = Dimensions.get('window');

const Boarding = (props) => {
  const { navigation } = props;
  return (
    <View style={styles.container}>
      <Image
        style={styles.image1}
        source={require('../auth/assets/background/Illustration.png')}
      />

      <View style={styles.viewBoarding}>
        <View style={styles.desContainer}>
         
          <MaskedView
            maskElement={
              <Text style={[{ backgroundColor: 'transparent' , fontWeight: 'bold', fontSize: width * 0.045, marginVertical : width * -0.01}]}>
                DeepChat
              </Text>
            }
          >
            <LinearGradient
              colors={['#438875', '#99F2C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.deepChatText, { opacity: 0 }]}>DeepChat</Text>
            </LinearGradient>
          </MaskedView>
        

          <Text style={styles.textHeader}>is a secure messaging app with end-to-end encryption, real-time chats. It ensures privacy with self-destructing messages and customizable security settings.</Text>
        </View>
        <View style={styles.iconContainer}>
         
          <View style={styles.iconWrapper}>
            <Image
              style={styles.icon}
              source={require('../auth/assets/icon/icon_google.png')}
            />
          </View>
        </View>

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.btnContainer}>
          <LinearGradient
            colors={['#438875', '#99F2C8']}
            style={styles.signUpButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpText}>Sign up with mail</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.loginView}>
            <Text style={styles.existingAccount}>Existing account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <MaskedView
                maskElement={
                  <Text style={[styles.loginText, { backgroundColor: 'transparent' }]}>
                    Log in
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#438875', '#99F2C8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.loginText, { opacity: 0 }]}>Log in</Text>
                </LinearGradient>
              </MaskedView>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Boarding;

const styles = StyleSheet.create({
  desContainer: {
    padding: width * 0.01,
    marginLeft: width * 0.15,
    justifyContent: 'flex-start',
    width: '95%'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  viewBoarding: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    alignItems: 'center',
    paddingBottom: height * 0.05,
    backgroundColor: '#121212',
    zIndex: 1,
  },
  image1: {
    width: width * 0.82,
    height: height * 0.42,
    position: 'absolute',
    top: height * 0.06,
  },
  textHeader: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#ffffff',
    width: '80%',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: width * 0.05,
  },
  iconWrapper: {
    backgroundColor: '#F7F7FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 999,
    width: width * 0.12,
    height: width * 0.12,
    marginVertical: width * 0.06
  },
  icon: {
    width: width * 0.06,
    height: width * 0.06,
    resizeMode: 'contain',
  },
  orContainer: {
    marginVertical: width * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: width * 0.05,
  },
  orLine: {
    width: width * 0.3,
    height: 1,
    backgroundColor: '#CDD1D0',
  },
  orText: {
    fontWeight: '500',
    fontSize: width * 0.045,
    color: '#fff',
  },
  signUpButton: {
    height: height * 0.06,
    width: width * 0.8,
    borderRadius: width * 0.04,
    backgroundColor: '#002DE3',
    alignContent: 'center',
    justifyContent: 'center',
  },
  btnContainer: {
    padding: 0.02
  },
  signUpText: {
    fontSize: width * 0.04,
    color: 'black',
    textAlign: 'center',
  },
  existingAccount: {
    color: '#B9C1BE',
    fontSize: width * 0.035,
  },
  loginText: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
  },
  loginView: {
    padding: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

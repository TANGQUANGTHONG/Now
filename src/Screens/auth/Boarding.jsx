import {StyleSheet, Text, View, Image, TouchableOpacity, Pressable, Dimensions} from 'react-native';
import React from 'react';

const { width, height } = Dimensions.get('window');

const Boarding = (props) => {
  const { navigation } = props;
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../auth/assets/logo/logo-uihut2.png')}
      />
      <Image
        style={styles.image1}
        source={require('../auth/assets/background/ellipse-background.png')}
      />
      <Text style={styles.textHeader}>Connect friends easily & quickly</Text>
      <Text style={styles.text}>
        Our chat app is the perfect way to stay connected with friends and family.
      </Text>
      <View style={styles.iconContainer}>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../auth/assets/icon/icon_facebook.png')}
          />
        </View>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../auth/assets/icon/icon_google.png')}
          />
        </View>
        <View style={styles.iconWrapper}>
          <Image
            style={styles.icon}
            source={require('../auth/assets/icon/icon_apple.png')}
          />
        </View>
      </View>
      <View style={styles.orContainer}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>
      <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signUpText}>Sign up with mail</Text>
      </TouchableOpacity>
      <View style={styles.loginView}>
        <Text style={styles.existingAccount}>Existing account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}> Log in</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Boarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'black',
    gap: height * 0.03,  // Gap giữa các phần tử bằng 3% chiều cao
  },
  image: {
    width: width * 0.3,  // Chiều rộng bằng 20% chiều rộng màn hình
    height: height * 0.036,  // Chiều cao bằng 3% chiều cao màn hình
    marginTop: height * 0.03,  // Khoảng cách trên bằng 3% chiều cao màn hình
    position: 'absolute',
    zIndex: 2,
  },
  image1: {
    width: width * 1.5,  // Chiều rộng lớn hơn chiều rộng màn hình
    top: height * -0.4,  // Vị trí trên màn hình
    position: 'absolute',
    zIndex: 0,
  },
  textHeader: {
    fontSize: width * 0.15,  // Font size bằng 15% chiều rộng màn hình
    fontWeight: 'bold',
    color: 'white',
    width: '80%',
    marginTop: height * 0.06,  // Khoảng cách trên bằng 6% chiều cao màn hình
  },
  text: {
    fontSize: width * 0.045,  // Font size bằng 4.5% chiều rộng màn hình
    fontWeight: '400',
    color: '#B9C1BE',
    width: '80%',
    marginTop: height * 0.02,  // Khoảng cách trên bằng 2% chiều cao màn hình
  },
  iconContainer: {
    flexDirection: 'row',
    gap: width * 0.05,  // Khoảng cách giữa các icon bằng 5% chiều rộng màn hình
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 999,
    width: width * 0.12,  // Kích thước icon wrapper bằng 12% chiều rộng màn hình
    height: width * 0.12,  // Kích thước chiều cao bằng chiều rộng
  },
  icon: {
    width: width * 0.06,  // Kích thước icon bằng 6% chiều rộng màn hình
    height: width * 0.06,  // Chiều cao bằng chiều rộng
    resizeMode: 'contain',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: width * 0.05,  // Khoảng cách giữa OR text và line bằng 5% chiều rộng màn hình
  },
  orLine: {
    width: width * 0.3,  // Độ dài của line bằng 30% chiều rộng màn hình
    height: 1,
    backgroundColor: '#CDD1D0',
  },
  orText: {
    fontSize: width * 0.045,  // Font size của OR bằng 4.5% chiều rộng màn hình
    color: 'white',
  },
  signUpButton: {
    height: height * 0.06,  // Chiều cao nút bằng 6% chiều cao màn hình
    width: width * 0.8,  // Chiều rộng nút bằng 80% chiều rộng màn hình
    borderRadius: width * 0.04,  // Bo góc nút bằng 4% chiều rộng màn hình
    backgroundColor: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: width * 0.04,  // Font size của chữ trên nút bằng 4% chiều rộng màn hình
    color: '#000E08',
    textAlign: 'center',
  },
  existingAccount: {
    color: '#B9C1BE',
    fontSize: width * 0.035,  // Font size bằng 3.5% chiều rộng màn hình
  },
  loginText: {
    color: 'white',
  },
  loginView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

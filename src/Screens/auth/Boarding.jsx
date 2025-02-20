import {StyleSheet, Text, View, Image, TouchableOpacity, Pressable, Dimensions} from 'react-native';
import React from 'react';

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
      <Text style={styles.textHeader}>Connect easily with your family and friends over countries</Text>
    
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
        
      </View>
      <View style={styles.orContainer}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>
      <View style={styles.btnContainer}>
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
      </View>
    </View>
  );
};

export default Boarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  viewBoarding: {
    position: 'absolute',
    bottom: 15, // Đẩy xuống dưới cùng
    width: '100%',
    alignItems: 'center',
    paddingBottom: height * 0.05, // Tạo khoảng cách với mép dưới
    backgroundColor: 'white', // Nền trắng để không bị ảnh che
    zIndex: 1, // Đảm bảo nằm trên ảnh
  },
  image: {
    width: width * 0.3,  // Chiều rộng bằng 20% chiều rộng màn hình
    height: height * 0.036,  // Chiều cao bằng 3% chiều cao màn hình
    marginTop: height * 0.03,  // Khoảng cách trên bằng 3% chiều cao màn hình
    position: 'absolute',
    zIndex: 2,
  },
  image1: {
    width: width * 0.82, // Chiều rộng lớn hơn màn hình để phủ toàn bộ
    height: height * 0.42, // Giới hạn chiều cao ảnh để không che nội dung dưới
    position: 'absolute',
    top: height * 0.06, // Đẩy ảnh lên trên
  },
  textHeader: {
    fontSize: width * 0.08,  // Font size bằng 15% chiều rộng màn hình
    fontWeight: 'bold',
    color: 'black',
    width: '80%',
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
    backgroundColor: '#F7F7FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 999,
    width: width * 0.12,  // Kích thước icon wrapper bằng 12% chiều rộng màn hình
    height: width * 0.12,  // Kích thước chiều cao bằng chiều rộng
    marginVertical: width * 0.06
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
    fontWeight: '500',
    fontSize: width * 0.045,  // Font size của OR bằng 4.5% chiều rộng màn hình
    color: 'black',
  },
  signUpButton: {
    height: height * 0.06,  // Chiều cao nút bằng 6% chiều cao màn hình
    width: width * 0.8,  // Chiều rộng nút bằng 80% chiều rộng màn hình
    borderRadius: width * 0.04,  // Bo góc nút bằng 4% chiều rộng màn hình
    backgroundColor: '#002DE3',
    alignContent: 'center',
    justifyContent: 'center',
  },
  btnContainer:{
    padding: 0.02
  },
  signUpText: {
    fontSize: width * 0.04,  // Font size của chữ trên nút bằng 4% chiều rộng màn hình
    color: '#fff',
    textAlign: 'center',
  },
  existingAccount: {
    color: '#B9C1BE',
    fontSize: width * 0.035,  // Font size bằng 3.5% chiều rộng màn hình
  },
  loginText: {
    color: 'black',
    fontWeight: 'bold'
  },
  loginView: {
    padding: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

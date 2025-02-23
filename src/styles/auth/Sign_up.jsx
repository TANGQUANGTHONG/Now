import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.03,
    left: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#002DE3',
    marginTop: height * 0.07,
  },
  subtitle: {
    fontSize: width * 0.045,
    textAlign: 'center',
    color: 'gray',
    marginVertical: height * 0.015,
  },
  inputContainer: {
    marginTop: height * 0.03,
  },
  validText: {
    color: '#002DE3',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#e4e2de',
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.03,
    borderColor: '#CDD1D0',
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.03,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: width * 0.03,
  },
  bottomContainer: {
    marginVertical : width * 0.2,
    paddingHorizontal: width * 0.05,
  },
  loginButton: {
    padding: height * 0.02,
    alignItems: 'center',
    borderRadius: width * 0.03,
    marginBottom: height * 0.03,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center'
  },
  forgotPassword: {
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textforgotPassword:{
    color: '#002DE3',
    fontWeight: 'bold',
  },
  textforgotPassword2:{
    fontWeight: 'bold',
    color: 'gray',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: height * 0.03,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 1,
    marginHorizontal: width * 0.02,
  },
  socialIcon: {
    width: width * 0.08,
    height: width * 0.08,
  },
  socialText: {
    fontSize: width * 0.02,
    fontWeight: 'bold',
    color: 'black',
  },
  errorText:{
    color: 'red'
  }
});

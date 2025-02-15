import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    height: height,
    backgroundColor: '#fff',
    padding: width * 0.02,
  },
  content: {
    justifyContent: 'center',
    marginTop: width * 0.05,
  },
  errorInput: {
    borderBottomColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: width * 0.033,
    alignSelf: 'flex-end',
    marginTop: width * 0.05, 
  },
  backButton: {
    position: 'absolute',
    top: width * 0.05,
    left: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginTop: width * 0.1,
  },
  subtitle: {
    fontSize: width * 0.05,
    textAlign: 'center',
    color: 'gray',
    marginVertical: 0.05
  },
  activeCreateButton: {
    backgroundColor: '#24786D',
  },
  inputContainer: {
    width: '100%',
    marginTop: width * 0.07,
  },
  validText: {
    color: '#24786D',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: width * 0.15,
    borderBottomWidth: width * 0.004,
    borderBottomColor: '#CDD1D0',
    fontSize: width * 0.04,
    paddingHorizontal: width * 0.01,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: width * 0.02,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: width * 0.2,
    left: width * 0.02,
    right: width * 0.02,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: width * 0.03,
    alignItems: 'center',
    borderRadius: width * 0.07,
    marginVertical: width * 0.04
  },
  activeLoginButton: {
    backgroundColor: '#24786D',
  },
  loginText: {
    color: 'gray',
    fontSize: width * 0.05,
  },
  activeLoginText: {
    color: 'white',
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#24786D',
    fontWeight: 'bold',
  },
});

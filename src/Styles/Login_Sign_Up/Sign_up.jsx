import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    height: height,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    justifyContent: 'center',
    marginTop: 30,
  },
  errorInput: {
    borderBottomColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    alignSelf: 'flex-end', // Đảm bảo chữ lỗi luôn căn trái
    marginTop: 5, // Tạo khoảng cách giữa ô nhập và lỗi
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: 'gray',
    marginTop: 10,
    marginBottom: 20,
  },
  activeCreateButton: {
    backgroundColor: '#24786D',
  },
  inputContainer: {
    width: '100%',
    marginTop: 30,
  },
  validText: {
    color: '#24786D',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD1D0',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  activeLoginButton: {
    backgroundColor: '#24786D',
  },
  loginText: {
    color: 'gray',
    fontSize: 18,
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

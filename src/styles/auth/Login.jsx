import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    height: height, // Đặt chiều cao bằng chiều cao màn hình
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    marginTop: 30, // Tăng giá trị này để đẩy nội dung xuống thấp hơn
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
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 10,
    marginTop: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    width: 30,
    height: 30,
  },
  orText: {
    marginVertical: 10,
    color: 'gray',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  line: {
    flex: 1, // Thanh ngang tự dãn ra hai bên
    height: 1, // Độ dày của thanh ngang
    backgroundColor: '#CDD1D0', // Màu của thanh ngang
    marginHorizontal: 10, // Khoảng cách giữa "OR" và thanh ngang
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
  },
  
  
  inputContainer: {
    width: '100%',
    marginTop: 30,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
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
    backgroundColor: '#24786D', // Chuyển sang màu xanh khi hợp lệ
    
  },
  loginText: {
    color: 'gray',
    fontSize: 18,
  },
  activeLoginText: {
    color: 'white', // Chuyển chữ thành màu trắng khi hợp lệ
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#24786D',
    fontWeight: 'bold',
  },

});

export default styles;

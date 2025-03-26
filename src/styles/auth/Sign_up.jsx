import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    position: 'relative',  // Đảm bảo vị trí của icon sẽ dựa trên container
  },
  inputModal: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    color: 'gray',
    height: 45, // Chiều cao của input
    paddingRight: 40, // Tạo khoảng trống cho icon ở bên phải
  },
  iconInsideInput: {
    position: 'absolute',
    right: 10,  // Vị trí của icon nằm bên phải
    top: '50%', // Đặt icon nằm giữa theo chiều dọc
    transform: [{ translateY: -12 }], // Căn chỉnh để icon nằm chính giữa theo chiều dọc
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    alignItems: 'center',
    maxHeight: height * 0.4,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  inputModal: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: 'gray',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  randomIcon: {
    padding: 10,
    bottom: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#438875',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    alignItems: 'center', // Căn giữa các thành phần con theo chiều ngang
  },
  backButton: {
    width: width * 0.15,
    height: width * 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#002DE3',
  },
  subtitle: {
    fontSize: width * 0.045,
    textAlign: 'center',
    color: 'gray',
    marginVertical: height * 0.015,
  },
  inputContainer: {
    marginTop: height * 0.03,
    width: '100%', // Đảm bảo inputContainer chiếm toàn bộ chiều rộng để không bị lệch
  },
  validText: {
    color: 'gray',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: width * 0.035,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.04,
    borderColor: '#4A4A4A',
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.04,
    color: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  errorInput: {
    borderColor: '#FF4D4D',
    borderWidth: 2,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
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
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
  },
  loginButton: {
    borderColor: '#616060',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    borderRadius: width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  loginText: {
    color: '#bfbbbb',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  forgotPassword: {
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textforgotPassword: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textforgotPassword2: {
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
  errorText: {
    color: '#FF4D4D',
    fontSize: width * 0.035,
    marginTop: 5,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Căn giữa icon trong iconContainer
    width: '100%', // Đảm bảo iconContainer chiếm toàn bộ chiều rộng để căn giữa chính xác
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
    marginVertical: width * 0.06,
  },
  icon: {
    width: width * 0.06,
    height: width * 0.06,
    resizeMode: 'contain',
  },
});
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
  modalButton: {
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
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
  },
  validText: {
    color: 'gray',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: width * 0.035,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E', // Màu nền tối hơn, hiện đại
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.04, // Bo góc mềm mại hơn
    borderColor: '#4A4A4A', // Viền màu xám nhạt
    fontSize: width * 0.045,
    paddingHorizontal: width * 0.04,
    color: '#FFFFFF', // Chữ màu trắng
    shadowColor: '#000', // Thêm bóng
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Bóng cho Android
  },
  errorInput: {
    borderColor: '#FF4D4D', // Viền đỏ khi có lỗi
    borderWidth: 2, // Viền đậm hơn khi có lỗi
    shadowColor: '#FF4D4D', // Hiệu ứng bóng đỏ khi có lỗi
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
    paddingBottom: height * 0.03, // Tăng padding dưới để nút không sát đáy
  },
  loginButton: {
    paddingVertical: height * 0.02, // Padding dọc cân đối
    paddingHorizontal: width * 0.04, // Padding ngang
    alignItems: 'center',
    borderRadius: width * 0.04, // Bo góc mềm mại hơn
    shadowColor: '#000', // Thêm bóng cho nút
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6, // Bóng cho Android
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.045, // Tăng kích thước chữ
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
    color: '#FF4D4D', // Màu đỏ cho thông báo lỗi
    fontSize: width * 0.035,
    marginTop: 5,
  },
});
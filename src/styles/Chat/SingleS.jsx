import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 0, 
      backgroundColor: '#121212' 
    },
  
    imageWrapper: {
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      width: width * 0.5,
      height: height * 0.25,
    },
  
    loadingIndicator: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -width * 0.04 }, { translateY: -width * 0.04 }], // Scale based on screen width
    },
  
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: width * 0.01,
    },
  
    activeDot: {
      width: width * 0.02, 
      height: width * 0.02, 
      borderRadius: width * 0.01, 
      backgroundColor: 'green',
      marginLeft: width * 0.01, 
    },
  
    userStatus: {
      fontSize: width * 0.03, 
      color: '#888',
      marginHorizontal: width * 0.02, 
    },
  
    username: {
      fontSize: width * 0.05, 
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: height * 0.02, 
    },
  
    sentWrapper: {
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: height * 0.02, 
    },
  
    receivedWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: height * 0.02,
      marginBottom: height * 0.01,
    },
  
    avatar: {
      width: width * 0.1,
      height: width * 0.1,
      borderRadius: width * 0.05, 
      marginHorizontal: width * 0.03,
    },
  
    usernameText: {
      fontSize: width * 0.035,
      color: '#007bff',
      fontWeight: 'bold',
      marginBottom: height * 0.005,
    },
  
    sentContainer: {
      backgroundColor: '#99F2C8',
      padding: width * 0.03, 
      borderRadius: width * 0.05, 
      maxWidth: '100%',
      alignSelf: 'flex-end',
      marginBottom: height * 0.001, 
    },
  
    receivedContainer: {
      backgroundColor: '#FFFFFF',
      padding: width * 0.03,
      borderRadius: width * 0.05,
      maxWidth: '70%',
      marginBottom: height * 0.015,
    },
  
    SendmessageText: {
      fontSize: width * 0.04, 
      color: '#000000'
    },
  
    ReceivedmessageText: {
      fontSize: width * 0.04, 
      color: '#0F1828'
    },
  
    deletedText: {
      fontSize: width * 0.04,
      color: '#999',
      fontStyle: 'italic',
    },
  
    Sendtimestamp: {
      fontSize: width * 0.03,
      color: '#000000',
      marginTop: height * 0.007,
      alignSelf: 'flex-end',
      flexDirection: 'row',
    },
  
    Revecivedtimestamp: {
      fontSize: width * 0.03, 
      color: '#000000',
      marginTop: height * 0.007, 
      alignSelf: 'flex-end',
      flexDirection: 'row',
    },
  
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: '#f0f0f0',
      position: 'relative', // Để các phần tử con absolute hoạt động đúng
    },
  
    inputWrapper: {
      flex: 1,
      backgroundColor: '#F7F7FC',
      borderRadius: width * 0.03,
      marginRight: width * 0.025, 
    },
  
    input: {
      fontSize: width * 0.04, 
      color: '#0F1828',
      padding: width * 0.02, 
      backgroundColor: '#F7F7FC',
    },
  
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: height * 0.015, 
      paddingHorizontal: width * 0.04,
      justifyContent: 'space-between',
      backgroundColor: '#000000',
      width: '100%',
    },
  
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-start',
    },
  
    headerAvatar: {
      width: width * 0.1, 
      height: width * 0.1,
      borderRadius: (width * 0.1) / 2, 
    },
  
    headerUsername: {
      fontSize: width * 0.035, 
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: width * 0.025, 
    },
  
    backButton: {
      padding: width * 0.02,
      },
  
    iconButton: {
      padding: width * 0.025,
      borderRadius: width * 0.05,
    },
  
    sendButton: {
      padding: width * 0.03,
      borderRadius: width * 0.05, 
    },
  
    typingText: {
      fontSize: width * 0.035,
      fontStyle: 'italic',
      color: '#007bff',
      marginLeft: width * 0.015,
      backgroundColor: '#FFFFFF',
      width: '25%',
      borderRadius: width * 0.025, 
      padding: width * 0.01, 
    },
  
    chatStatus: {
      left: width * 0.02,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: width * 0.025, 
      paddingVertical: height * 0.005, 
      borderRadius: width * 0.02, 
    },
  
    chatCountText: {
      fontSize: width * 0.025,
      fontWeight: 'bold',
      color: '#007bff',
    },
  
    resetText: {
      fontSize: width * 0.027,
      fontWeight: 'bold',
      color: 'red',
    },
  
    seenStatusContainer: {
      alignSelf: 'flex-end', 
      marginTop: height * 0.003, 
      marginRight: width * 0.025, 
    },
  
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
  
    modalContent: {
      backgroundColor: '#fff',
      padding: width * 0.05,
      borderRadius: width * 0.025, 
      width: '80%', 
      alignItems: 'center',
    },
  
    modalTitle: {
      fontSize: width * 0.045, 
      fontWeight: 'bold',
      marginBottom: height * 0.01, 
      color: 'black',
    },
  
    modalOption: {
      paddingVertical: height * 0.015, 
      width: '100%', 
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
  
    modalText: {
      color: 'black',
      fontSize: width * 0.04,
    },
  
    modalCancel: {
      marginTop: height * 0.01, 
      paddingVertical: height * 0.015,
      width: '100%', 
      alignItems: 'center',
    },
  
    selfDestructMessage: {
      backgroundColor: '#ffcccb',
      opacity: 0.8,
    },
  
  
    TextselfDestructTimer: {
      fontSize: width * 0.03,
      fontWeight: 'bold',
      color: 'black',
      textAlign: 'right',
    },
  
    imageButton: {
      padding: width * 0.025, 
      backgroundColor: '#f5f5f5',
      borderRadius: width * 0.025, 
      alignItems: 'center',
      marginRight: width * 0.025, 
    },
  
    imageMessage: {
      width: width * 0.5, 
      height: width * 0.5,
      borderRadius: width * 0.025,
      marginTop: height * 0.005, 
    },
  
    sentImage: {
      alignSelf: 'flex-end',
    },
  
    receivedImage: {
      alignSelf: 'flex-start',
    },
  
    pinnedMessageContainer: {
      backgroundColor: '#f0f0f0',
      padding: width * 0.025, 
      margin: width * 0.0125, 
      borderRadius: width * 0.025, 
    },
  
    pinnedMessageText: {
      fontSize: width * 0.04,
      color: 'blue',
    },
  
    pinnedMessageTime: {
      fontSize: width * 0.03, 
      color: '#888',
      marginTop: height * 0.005, 
    },
  
    pinnedHeader: {
      fontSize: width * 0.045,
      fontWeight: 'bold',
      padding: width * 0.025,
      backgroundColor: '#e0e0e0',
    },
  
    fullScreenImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      backgroundColor: 'black',
    },
  
    iconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    mainButton: {
      padding: width * 0.025,
    },
  
    menuContainer: {
      position: 'absolute',
      bottom: 50, // Khoảng cách từ bottom của inputContainer
      right: 10, // Đặt menu gần nút 3 chấm
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 10,
      elevation: 5, // Shadow cho Android
      shadowColor: '#000', // Shadow cho iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
        },
  
    menuText: {
      marginLeft:  width * 0.025,
      fontSize: width * 0.04,
    },
    videoWrapper: {
      borderRadius: 10,
      overflow: 'hidden',
      marginVertical: 5,
    },
    videoMessage: {
      width: 250,
      height: 300,
      backgroundColor: 'black',
    },
    loadingIndicator: {
      alignSelf: 'center',
      marginVertical: 10,
    },
    selfDestructTimer: {
      alignSelf: 'flex-end', // Căn phải nhưng chỉ chiếm không gian nội dung
      color: '#FFFFFF', // Chữ trắng
      // paddingVertical: 4, // Padding dọc nhẹ
      paddingHorizontal: 8, // Padding ngang vừa đủ
      borderRadius: 10, // Bo góc mềm mại
      fontSize: 13, // Kích thước chữ dễ đọc
      fontWeight: '500', // Độ đậm trung bình
    },
    playButton: {
      marginRight: 10,
    },
    audioWrapper: {
      flexDirection: 'column', // Xếp dọc: icon, timer, waveform
      alignItems: 'center', // Căn giữa theo chiều ngang
    },
    audioTimer: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
      marginBottom: 4, // Khoảng cách giữa timer và waveform
      fontWeight: '500',
    },
    waveformContainer: {
      flexDirection: 'row', // Xếp các thanh sóng âm theo hàng ngang
      justifyContent: 'space-between',
      width: 200, // Chiều rộng cố định cho sóng âm
      height: 30, // Chiều cao tối đa của sóng âm
    },
    waveformBar: {
      width: 3, // Chiều rộng mỗi thanh
      marginHorizontal: 1, // Khoảng cách giữa các thanh
      borderRadius: 2, // Bo góc nhẹ cho thanh
    },
  });
  

export default styles;

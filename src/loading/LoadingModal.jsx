import React from 'react';
import { Modal, View } from 'react-native';
import LottieView from 'lottie-react-native';
import styles from './LoadingModalStyles';

const LoadingModal = ({ visible }) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.modalBackground}>
        <LottieView
          source={require('./loading3.json')} // Đường dẫn tới animation
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      </View>
    </Modal>
  );
};

export default LoadingModal;

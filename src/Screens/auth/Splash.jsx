import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const Splash = () => {
  return (
    <View style={styles.container}>
      <MaskedView
        maskElement={
          <View style={styles.center}>
            <Text style={styles.buttonText}>Deepchat</Text>
          </View>
        }>
        <LinearGradient
          colors={['#438875', '#99F2C8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.linearGradient}
        />
      </MaskedView>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  linearGradient: {
    width: 200,
    height: 50,
  },
  buttonText: {
    color: '#438875',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
});

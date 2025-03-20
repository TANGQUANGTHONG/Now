import MapView, {Marker} from 'react-native-maps';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import GetCurrentLocation from '../../geolocation/Geolocation ';
import {useNavigation, useRoute} from '@react-navigation/native'; // Thêm vào
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


export default function MapScreen() {
  const location = GetCurrentLocation();
  const navigation = useNavigation();
  const route = useRoute();
  const {userId, myId, username, img, messages, externalLocation, isGui} =
    route.params || {};
  const handleSendLocation = () => {
    console.log('Vị trí đã gửi:', location);
    if (location) {
      navigation.navigate('Single', {
        userId,
        myId,
        username,
        img,
        messages,
        locationMessage: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
      });
    }
    // Ở đây bạn có thể xử lý việc gửi vị trí đi, ví dụ gọi API hoặc truyền qua props
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
            {/* Nút quay lại đặt trên cùng */}
            <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: 15,
          borderRadius: 30,
          zIndex: 10,
        }}>
        <MaterialIcons name="arrow-back-ios-new" size={15} color="white" />
      </TouchableOpacity>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: externalLocation
            ? externalLocation.latitude
            : location.latitude,
          longitude: externalLocation
            ? externalLocation.longitude
            : location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        <Marker
          coordinate={{
            latitude: externalLocation
              ? externalLocation.latitude
              : location.latitude,
            longitude: externalLocation
              ? externalLocation.longitude
              : location.longitude,
          }}
          title={externalLocation ? 'Vị trí được chia sẻ' : 'Vị trí của bạn'}
        />
      </MapView>
      {isGui && (
        <TouchableOpacity style={styles.button} onPress={handleSendLocation}>
          <Text style={styles.buttonText}>Gửi vị trí</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

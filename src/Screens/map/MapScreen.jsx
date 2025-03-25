import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, myId, username, img, messages, externalLocation, isGui } = route.params || {};

  // Hàm yêu cầu quyền truy cập vị trí
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Ứng dụng cần quyền để lấy vị trí của bạn.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'Cho phép',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Lỗi khi xin quyền:', err);
      return false;
    }
  };

  // Hàm lấy vị trí, ưu tiên Wi-Fi trước, sau đó thử GPS nếu thất bại
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Bạn cần cấp quyền truy cập vị trí để tiếp tục.');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Hàm thử lấy vị trí với cấu hình cụ thể
    const tryGetLocation = (highAccuracy, timeout) => {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => resolve(position),
          error => reject(error),
          { enableHighAccuracy: highAccuracy, timeout: timeout, maximumAge: 10000 },
        );
      });
    };

    try {
      // Thử lấy vị trí bằng Wi-Fi/mạng di động trước (enableHighAccuracy: false)
      console.log('📡 Thử lấy vị trí bằng Wi-Fi/mạng di động...');
      const position = await tryGetLocation(false, 15000);
      const { latitude, longitude } = position.coords;
      console.log('📍 Vị trí lấy được từ Wi-Fi/mạng:', { latitude, longitude });
      setLocation({ latitude, longitude });
      setLoading(false);
    } catch (wifiError) {
      console.log('❌ Lỗi khi lấy vị trí bằng Wi-Fi/mạng:', wifiError);
      try {
        // Thử lại bằng GPS nếu Wi-Fi thất bại (enableHighAccuracy: true)
        console.log('📍 Thử lấy vị trí bằng GPS...');
        const position = await tryGetLocation(true, 15000);
        const { latitude, longitude } = position.coords;
        console.log('📍 Vị trí lấy được từ GPS:', { latitude, longitude });
        setLocation({ latitude, longitude });
        setLoading(false);
      } catch (gpsError) {
        console.log('❌ Lỗi khi lấy vị trí bằng GPS:', gpsError);
        setError('Không thể lấy vị trí. Vui lòng kiểm tra kết nối hoặc bật GPS.');
        setLoading(false);
      }
    }
  };

  // Lấy vị trí khi component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSendLocation = () => {
    if (location) {
      console.log('Vị trí đã gửi:', location);
      navigation.navigate('Single', {
        userId,
        myId,
        username,
        img,
        messages,
        locationMessage: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
      });
    } else {
      console.log('⚠️ Không có vị trí để gửi');
    }
  };

  // Hiển thị loading khi đang lấy vị trí
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  // Hiển thị lỗi nếu không lấy được vị trí
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hiển thị bản đồ khi có vị trí
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}>
        <MaterialIcons name="arrow-back-ios-new" size={15} color="white" />
      </TouchableOpacity>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: externalLocation ? externalLocation.latitude : location.latitude,
          longitude: externalLocation ? externalLocation.longitude : location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        <Marker
          coordinate={{
            latitude: externalLocation ? externalLocation.latitude : location.latitude,
            longitude: externalLocation ? externalLocation.longitude : location.longitude,
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
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 30,
    zIndex: 10,
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
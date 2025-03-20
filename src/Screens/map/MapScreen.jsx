import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet, ActivityIndicator,Text} from 'react-native';
import GetCurrentLocation from '../../geolocation/Geolocation ';

export default function MapScreen() {
  const location = GetCurrentLocation();
  console.log("canhphan",location);

  if (!location) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Vị trí của bạn"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

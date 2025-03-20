import Geolocation from '@react-native-community/geolocation';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

export default function GetCurrentLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          return;
        }
      }
      Geolocation.getCurrentPosition(
        position => {
          setLocation(position.coords);
        },
        error => {
          console.log("không lấy được định vị",error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };

    requestLocationPermission();
  }, []);

  return location;
}

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service'; // 🔥 Import thư viện mới
import database from '@react-native-firebase/database';
import { getDistance } from 'geolib';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { oStackHome, oTab } from '../../navigations/HomeNavigation';

const NearbyFriends = ({ route }) => {
  const navigation = useNavigation();
  const { userId } = route.params;
  const [location, setLocation] = useState(null);
  const [nearbyFriends, setNearbyFriends] = useState([]);
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const distanceOptions = [1, 5, 10, 20, 15000];

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log(`📌 Vị trí hiện tại: ${latitude}, ${longitude}`);

        setLocation({ latitude, longitude });

        if (userId) {
          database()
            .ref(`/users/${userId}`)
            .update({ latitude, longitude })
            .then(() => console.log('✅ Đã cập nhật vị trí lên Firebase'))
            .catch(err => console.log('❌ Lỗi khi cập nhật vị trí:', err));
        }
      },
      error => console.log('❌ Lỗi khi lấy vị trí:', error),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
  };

  const fetchNearbyFriends = async (latitude, longitude, maxDistance) => {
    setIsLoading(true);

    database()
      .ref('/users')
      .once('value', snapshot => {
        if (!snapshot.exists()) {
          console.log('❌ Không tìm thấy dữ liệu user trong Firebase');
          setIsLoading(false);
          return;
        }

        const allUsers = snapshot.val();
        if (!allUsers) return;

        console.log('📌 Tất cả user từ Firebase:', allUsers);

        const friendsWithLocation = Object.keys(allUsers)
          .filter(
            id =>
              id !== userId && allUsers[id].latitude && allUsers[id].longitude,
          )
          .map(id => {
            const friend = allUsers[id];
            const distance =
              getDistance(
                { latitude, longitude },
                { latitude: friend.latitude, longitude: friend.longitude },
              ) / 1000;

            return { id, ...friend, distance };
          });

        const friendsNearby = friendsWithLocation.filter(
          friend => friend.distance <= maxDistance,
        );

        console.log('👥 Danh sách bạn bè gần đây:', friendsNearby);
        setNearbyFriends(friendsNearby);
        setIsLoading(false);
      });
  };

  const handleDistanceChange = distance => {
    setSelectedDistance(distance);
    console.log(`📌 Đang tìm bạn trong phạm vi ${distance} km`);

    if (location) {
      fetchNearbyFriends(location.latitude, location.longitude, distance);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      console.log('📌 Gọi hàm fetchNearbyFriends()');
      fetchNearbyFriends(location.latitude, location.longitude, selectedDistance);
    }
  }, [location, selectedDistance]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
        <TouchableOpacity onPress={() => navigation.navigate(oTab.Home.name)} style={{ marginRight: 10 }}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
          Tìm bạn gần đây
        </Text>
      </View>
  
      <View style={{ alignItems: 'center', marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
          {distanceOptions.map(distance => (
            <TouchableOpacity
              key={distance}
              onPress={() => handleDistanceChange(distance)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                marginHorizontal: 5,
                backgroundColor: selectedDistance === distance ? '#007bff' : '#ddd',
                borderRadius: 20,
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{distance} km</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
  
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, fontSize: 16, color: 'gray' }}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={nearbyFriends}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Single', {
                  userId: item.id,
                  myId: userId,
                  username: decryptMessage(item.name),
                  img: decryptMessage(item.Image),
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 15,
                backgroundColor: 'white',
                borderRadius: 10,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <Image
                source={{
                  uri: decryptMessage(item.Image) || 'https://via.placeholder.com/50',
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 15,
                }}
              />
              <Text>{decryptMessage(item.name)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default NearbyFriends;

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, PermissionsAndroid, TouchableOpacity } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';
import { getDistance } from 'geolib';

const NearbyFriends = ({ route }) => {
  const { userId } = route.params; // 👉 Lấy userId từ navigation
  const [location, setLocation] = useState(null);
  const [nearbyFriends, setNearbyFriends] = useState([]);
  const [selectedDistance, setSelectedDistance] = useState(5); // Mặc định 5km

  // Danh sách khoảng cách có thể chọn
  const distanceOptions = [1, 5, 10, 20];

  // Yêu cầu quyền truy cập GPS trên Android
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Cho phép truy cập vị trí',
          message: 'Ứng dụng cần truy cập vị trí của bạn để tìm bạn bè gần đây',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Lấy vị trí hiện tại
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        // Cập nhật vị trí của người dùng lên Firebase
        database().ref(`/users/${userId}`).update({
          latitude,
          longitude,
        });

        // Sau khi có vị trí, lấy danh sách bạn bè gần đây
        fetchNearbyFriends(latitude, longitude, selectedDistance);
      },
      (error) => console.log('❌ Lỗi khi lấy vị trí:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Lấy danh sách bạn bè gần đây từ Firebase
  const fetchNearbyFriends = async (latitude, longitude, maxDistance) => {
    database().ref('/users').once('value', (snapshot) => {
      const allUsers = snapshot.val();
      if (!allUsers) return;

      const friendsNearby = Object.keys(allUsers)
        .filter((id) => id !== userId) // Không lấy chính mình
        .map((id) => {
          const friend = allUsers[id];
          const distance = getDistance(
            { latitude, longitude },
            { latitude: friend.latitude, longitude: friend.longitude }
          ) / 1000; // Chuyển đổi từ mét sang km

          return { id, ...friend, distance };
        })
        .filter((friend) => friend.distance <= maxDistance); // Lọc theo khoảng cách đã chọn

      setNearbyFriends(friendsNearby);
    });
  };

  // Khi người dùng chọn khoảng cách mới
  const handleDistanceChange = (distance) => {
    setSelectedDistance(distance);
    if (location) {
      fetchNearbyFriends(location.latitude, location.longitude, distance);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
        📍 Vị trí hiện tại: {location ? `${location.latitude}, ${location.longitude}` : 'Đang lấy...'}
      </Text>

      {/* Bộ chọn khoảng cách */}
      <View style={{ flexDirection: 'row', marginVertical: 20 }}>
        {distanceOptions.map((distance) => (
          <TouchableOpacity
            key={distance}
            onPress={() => handleDistanceChange(distance)}
            style={{
              padding: 10,
              marginHorizontal: 5,
              backgroundColor: selectedDistance === distance ? 'blue' : 'gray',
              borderRadius: 5,
            }}
          >
            <Text style={{ color: 'white' }}>{distance} km</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>👥 Bạn bè gần đây:</Text>
      {nearbyFriends.length > 0 ? (
        <FlatList
          data={nearbyFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ddd' }}>
              <Text>🧑 {item.id} - {item.distance.toFixed(2)} km</Text>
            </View>
          )}
        />
      ) : (
        <Text>😢 Không có ai trong phạm vi {selectedDistance} km</Text>
      )}
    </View>
  );
};

export default NearbyFriends;

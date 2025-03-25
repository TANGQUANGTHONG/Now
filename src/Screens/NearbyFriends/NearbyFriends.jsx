import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';
import {getDistance} from 'geolib';
import MapView, {PROVIDER_GOOGLE, Marker, Callout} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {encryptMessage, decryptMessage} from '../../cryption/Encryption';
import { Animated } from 'react-native';
const NearbyFriendsMap = ({route}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current; // Giá trị animation
  const navigation = useNavigation();
  const {userId} = route.params;
  const [location, setLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const avatarUri =
    ' https://res.cloudinary.com/dzlomqxnn/image/upload/v1741918231/upload_ffaki1.jpg?f_auto';

  const distanceOptions = [1, 5, 10, 20, 50, 20000];

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

const getLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return;

  const tryGetLocation = (highAccuracy, timeout) => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {enableHighAccuracy: highAccuracy, timeout: timeout, maximumAge: 10000},
      );
    });
  };
  try {
    // Thử lại với Wi-Fi/mạng di động
    const position = await tryGetLocation(false, 15000);
    const {latitude, longitude} = position.coords;
    setLocation({latitude, longitude});
    updateFirebase(latitude, longitude);
  } catch (fallbackError) {
    console.log('❌ Lỗi khi lấy vị trí bằng Wi-Fi/mạng di động:', fallbackError);
    alert('Không thể lấy vị trí. Vui lòng kiểm tra kết nối hoặc ra ngoài để tín hiệu tốt hơn.');
  }
  try {
    // Thử với GPS trước
    const position = await tryGetLocation(true, 15000);
    const {latitude, longitude} = position.coords;
    setLocation({latitude, longitude});
    updateFirebase(latitude, longitude);
  } catch (error) {
    console.log('❌ Lỗi khi lấy vị trí bằng GPS:', error);
   
  }
};

const updateFirebase = (latitude, longitude) => {
  if (userId) {
    database()
      .ref(`/users/${userId}`)
      .update({latitude, longitude})
      .then(() => console.log('✅ Đã cập nhật vị trí lên Firebase'))
      .catch(err => console.log('❌ Lỗi khi cập nhật vị trí:', err));
  }
};
  
  const fetchUsers = async () => {
    setIsLoading(true);

    database()
      .ref('/users')
      .once('value', snapshot => {
        if (!snapshot.exists()) {
          console.log('❌ Không tìm thấy dữ liệu users');
          setIsLoading(false);
          return;
        }

        const allUsers = snapshot.val();
        if (!allUsers) {
          console.log('❌ Dữ liệu users bị null hoặc undefined');
          setIsLoading(false);
          return;
        }

        console.log('📌 Dữ liệu gốc từ Firebase:', allUsers);

        const usersWithLocation = Object.keys(allUsers)
          .filter(id => allUsers[id]?.latitude && allUsers[id]?.longitude)
          .map(id => {
            const user = allUsers[id];

            // 🔥 Kiểm tra dữ liệu trước khi giải mã
            console.log(`🔒 Dữ liệu mã hóa của user ${id}:`, user);

            // ✅ Giải mã tên & avatar (nếu có)
            const name = user.name
              ? decryptMessage(user.name)
              : 'Không xác định';
            let avatar = user.Image
              ? decryptMessage(user.Image)
              : 'https://via.placeholder.com/80';

            // ✅ Nếu avatar từ Cloudinary, thêm `?f_auto` để tối ưu ảnh
            if (avatar.includes('cloudinary')) {
              avatar = `${avatar}?f_auto`;
            }

            console.log(`✅ User ${id} - Tên: ${name}, Avatar: ${avatar}`);

            // ✅ Tính khoảng cách nếu có vị trí
            const distance = location
              ? getDistance(
                  {latitude: location.latitude, longitude: location.longitude},
                  {latitude: user.latitude, longitude: user.longitude},
                ) / 1000
              : null;

            return {
              id,
              name,
              avatar,
              latitude: user.latitude,
              longitude: user.longitude,
              distance,
            };
          })
          // ✅ Lọc chỉ những người trong phạm vi đã chọn
          .filter(
            user => user.distance !== null && user.distance <= selectedDistance,
          );

        console.log(
          '📌 Danh sách users sau khi lọc theo phạm vi:',
          usersWithLocation,
        );

        setUsers(usersWithLocation);
        setIsLoading(false);
      });
  };

  const handleMarkerPress = user => {
    if (user.id === userId) {
      console.log("🚫 Bạn đã bấm vào chính mình, không chuyển trang!");
      return;
    }
  
    // Hiệu ứng phóng to
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  
    // Chuyển đến màn hình Single
    navigation.navigate('Single', {
      userId: user.id,
      myId: userId,
      username: user.name,
      img: user.avatar,
    });
  };

  // Cập nhật khi thay đổi khoảng cách
  useEffect(() => {
    if (location) {
      fetchUsers();
    }
  }, [location, selectedDistance]);

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={{flex: 1}}>
    

      {/* Thanh tiêu đề */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          backgroundColor: '#fff',
        }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>Tìm bạn gần đây</Text>
      </View>
      <View>
      <FlatList
  horizontal
  data={users}
  keyExtractor={item => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => handleMarkerPress(item)}>
      <View style={{ alignItems: 'center', margin: 10 }}>
        <Image
          source={{ uri: item.avatar }}
          style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "white" }}
          resizeMode="cover"
        />
        <Text style={{ fontWeight: 'bold', marginTop: 5 }}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  )}
/>
</View>

      {/* Bản đồ */}
      <View style={{flex: 1}}>
        {location ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{flex: 1}}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}>
            {/* Marker của bạn */}
            <Marker
              coordinate={location}
              title="Bạn"
              description="Vị trí hiện tại"
              pinColor="blue"
            />

            {/* Hiển thị tất cả user */}
            {users.map(user => (
  <Marker
    key={user.id}
    coordinate={{ latitude: user.latitude, longitude: user.longitude }}
    title={user.name}
    onPress={() => {
      if (user.id === userId) {
        console.log("🚫 Bạn đã bấm vào chính mình, không chuyển trang!");
        return;
      }
      navigation.navigate('Single', {
        userId: user.id,
        myId: userId,
        username: user.name, // Tên đã giải mã
        img: user.avatar, // Ảnh đại diện đã giải mã
      });
    }}
  >
    {/* Custom Marker: Avatar thay cho pin */}
    <View style={{ alignItems: "center" }}>
      <Image
        source={{ uri: user.avatar }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 2,
          borderColor: "white",
        }}
        resizeMode="cover"
      />
      <Text style={{ fontSize: 12, fontWeight: "bold", textAlign: "center", marginTop: 2 }}>
        {user.name}
      </Text>
    </View>
  </Marker>
))}

          </MapView>
        ) : (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Đang tải bản đồ...</Text>
          </View>
        )}
      </View>
      <View>
        {/* Chọn khoảng cách */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            padding: 10,
            backgroundColor: '#fff',
            height: 50,
          }}>
          {distanceOptions.map(distance => (
            <TouchableOpacity
              key={distance}
              onPress={() => setSelectedDistance(distance)}
              style={{
                paddingVertical: 0,
                paddingHorizontal: 20,
                marginHorizontal: 5,
                backgroundColor:
                  selectedDistance === distance ? '#007bff' : '#ddd',
                borderRadius: 20,
                height: 40,
              }}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                {distance} km
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
    </View>
  );
};

export default NearbyFriendsMap;

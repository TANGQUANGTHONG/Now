import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_search from '../../components/items/Item_search';
import {decryptMessage} from '../../cryption/Encryption';
import {oStackHome} from '../../navigations/HomeNavigation';
import {useNavigation} from '@react-navigation/native';
import {getAuth} from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {debounce} from 'lodash'; // Thêm thư viện lodash để tối ưu hoá tìm kiếm

const {width, height} = Dimensions.get('window');

const Search = () => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigation = useNavigation();
  const auth = getAuth();

  const handleUserPress = (userId, username, img) => {
    const myId = auth.currentUser?.uid;
    navigation.navigate(oStackHome.Single.name, {
      userId,
      myId,
      username,
      img,
    });
  };

  const fetchUsers = () => {
    const myId = auth.currentUser?.uid;
    const usersRef = database().ref('users');

    usersRef.on('value', snapshot => {
      const usersData = snapshot.val();

      if (usersData) {
        const userList = Object.keys(usersData)
          .filter(key => key !== myId)
          .map(key => {
            const user = usersData[key];
            let decryptedNickname = user.nickname
              ? decryptMessage(user.nickname)
              : 'Không có nickname';

            // Thêm @ vào trước nickname nếu chưa có
            if (decryptedNickname && !decryptedNickname.startsWith('@')) {
              decryptedNickname = `@${decryptedNickname}`;
            }
            return {
              id: key,
              username: user.name ? decryptMessage(user.name) : 'Không có tên',
              nickname: decryptedNickname,
              email: user.email ? decryptMessage(user.email) : 'Không có email',
              img: user.Image
                ? decryptMessage(user.Image)
                : 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
            };
          });
        // console.log('Dữ liệu người dùng:', userList);
        setUsers(userList);
      } else {
        // console.log('Không có dữ liệu người dùng');
      }
    });

    return () => usersRef.off('value');
  };

  const handleSearch = text => {
    setSearchText(text);
    if (text === '') {
      setFilteredUsers([]);
    } else if (text.startsWith('@')) {
      // Nếu text bắt đầu bằng @ thì tìm kiếm theo nickname (bỏ ký tự @ khi so sánh)
      const filtered = users.filter(user =>
        user.nickname.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredUsers(filtered);
    } else {
      // Ngược lại, tìm kiếm theo username
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredUsers(filtered);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.container_search}>
        <Icon name="search" size={24} color="#000E08" />
        <TextInput
          placeholder="Search"
          value={searchText}
          onChangeText={handleSearch} // Gọi hàm debounce
        />
      </View>
      <View>
        <FlatList
          data={filteredUsers}
          renderItem={({item}) => (
            <Item_search
              data={item}
              onPress={() => handleUserPress(item.id, item.username, item.img)}
            />
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.02,
    flex: 1,
  },
  container_search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6F6',
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.03,
  },
  input: {
    marginLeft: width * 0.025,
    fontSize: width * 0.03,
  },
  list_search: {
    marginTop: height * 0.06,
  },
});

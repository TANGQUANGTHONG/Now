import { FlatList, StyleSheet, TextInput, View, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_search from '../../components/items/Item_search';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

const Search = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');

  const db = getFirestore(app);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = [];
        const querySnapshot = await getDocs(collection(db, 'users'));
        querySnapshot.forEach(doc => {
          userList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(userList);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredUsers([]); 
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, users]);

  return (
    <View style={styles.container}>
      <View style={styles.container_search}>
        <Icon name="search" size={24} color="#000E08" />
        <TextInput
          placeholder="Tìm kiếm..."
          style={styles.input}
          value={searchText}
          onChangeText={text => setSearchText(text)}
        />
      </View>
      <View style={styles.list_search}>
        {searchText.trim() !== '' && (
          <FlatList
            data={filteredUsers}
            renderItem={({ item }) => <Item_search data={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    fontWeight: '500',
    fontSize: width * 0.03,
    flex: 1,
  },
  list_search: {
    marginTop: height * 0.06,
  },
});

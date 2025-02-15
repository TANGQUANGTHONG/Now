import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import { firestoreDb } from './src/fireBase/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const App = () => {
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Truy vấn collection "test"
        const usersSnapshot = await getDocs(collection(firestoreDb, 'test'));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Users: get', users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    // Thêm user mới
    //addUser();

    // Fetch users
    fetchUsers();
  }, []);

  const addUser = async () => {
    try {
      // Thêm user mới vào collection "test"
      const docRef = await addDoc(collection(firestoreDb, 'test'), {
        name: 'Phong Nguyễn',
        age: 22,
        email: 'phong@gmail.com'
      });
      console.log('User added! ID:', docRef.id);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <View style={styles.container}>
      <AppNavigation />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
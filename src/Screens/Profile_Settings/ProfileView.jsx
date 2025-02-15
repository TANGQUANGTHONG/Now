import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { decryptMessage } from '../../cryption/Encryption';
import firestore from '@react-native-firebase/firestore';
import { oStackHome } from '../../navigations/HomeNavigation';


const ProfileView = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const docRef = await firestore().collection('users').doc(userId).get();
        
        if (docRef.exists) {
          const data = docRef.data();
          setUser({
            username: decryptMessage(data.username),
            email: decryptMessage(data.email),
            img: decryptMessage(data.Image),
          });
        } else {
          console.error('User không tồn tại');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Image source={{ uri: user.img }} style={styles.avatar} />
          <Text style={styles.name}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Button
            title="Chat"
            onPress={() => navigation.navigate(oStackHome.Single.name, { userId })}
          />
        </>
      ) : (
        <Text>Đang tải...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
});

export default ProfileView;

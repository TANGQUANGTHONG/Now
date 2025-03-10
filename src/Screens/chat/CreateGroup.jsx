import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDatabase, ref, onValue, push } from '@react-native-firebase/database';
import { getAuth } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { decryptMessage, generateSecretKey } from '../../cryption/Encryption';

const CreateGroup = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const auth = getAuth();
  const db = getDatabase();
  const myId = auth.currentUser?.uid;

  useEffect(() => {
    const usersRef = ref(db, 'users');
    console.log(usersRef)
    onValue(usersRef, async snapshot => {
      if (!snapshot.exists()) return;
  
      const usersData = snapshot.val();
      const userEntries = Object.entries(usersData).filter(([id]) => id !== myId);
  
      const userList = await Promise.all(
        userEntries.map(async ([id, user]) => {
          const secretKey = generateSecretKey(id, myId); // id = otherUserId
          const decryptedName = safeDecrypt(user.name) || 'Người dùng';
          const decryptedAvatar = safeDecrypt(user.avatar) || 'Người dùng';
          
          return {
            id,
            name: decryptedName,
            avatar: decryptedAvatar || 'https://example.com/default-avatar.png',
          };
        })
      );
  
      setUsers(userList);
    });
  }, []);
  
  


    const safeDecrypt = (encryptedText, secretKey) => {
      try {
        if (!encryptedText) return 'Nội dung trống';
  
        const decryptedText = decryptMessage(encryptedText, secretKey);
  
  
        return decryptedText;
      } catch (error) {
        return 'Tin nhắn bị mã hóa';
      }
    };
  

  const toggleSelectUser = userId => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const createGroupChat = async () => {
    if (selectedUsers.length === 0) return;
    
    const groupRef = push(ref(db, 'groups'));
    const groupId = groupRef.key;

    await groupRef.set({
        name: `Nhóm mới ${new Date().toLocaleTimeString()}`,
        members: [myId, ...selectedUsers],
        owner: myId,  // Lưu người tạo nhóm
        createdAt: Date.now(),
      });
      

    navigation.navigate('GroupChat', { groupId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chọn thành viên</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItem,
              selectedUsers.includes(item.id) && styles.selectedUser,
            ]}
            onPress={() => toggleSelectUser(item.id)}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.createButton}
        onPress={createGroupChat}
      >
        <Icon name="checkmark-circle-outline" size={24} color="white" />
        <Text style={styles.createButtonText}>Tạo Nhóm</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginVertical: 5,
  },
  selectedUser: {
    backgroundColor: '#007bff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
});

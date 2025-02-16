import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ChatListScreen = ({navigation}) => {
  const [users, setUsers] = useState([]);
  const currentUser = auth().currentUser;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(snapshot => {
        const data = snapshot.docs
          .filter(doc => doc.id !== currentUser.uid) // Bỏ user hiện tại
          .map(doc => ({id: doc.id, ...doc.data()}));
        setUsers(data);
      });

    return () => unsubscribe();
  }, []);

  const createOrNavigateToChat = async user => {
    try {
      const groupsCollection = firestore().collection('groups');

      // Tìm group chat có cả currentUser và user được chọn
      const querySnapshot = await groupsCollection
        .where('members', 'array-contains', currentUser.uid)
        .get();

      let existingGroup = null;

      querySnapshot.forEach(doc => {
        const groupData = doc.data();
        if (groupData.members.includes(user.uid)) {
          existingGroup = {id: doc.id, ...groupData};
        }
      });

      if (existingGroup) {
        // Nếu group chat đã tồn tại
        navigation.navigate('Chat', {groupId: existingGroup.id});
      } else {
        // Nếu chưa có, tạo mới
        const newGroup = await groupsCollection.add({
          groupName: `Chat with ${user.email}`,
          members: [currentUser.uid, user.uid],
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        navigation.navigate('Chat', {groupId: newGroup.id});
      }
    } catch (error) {
      console.error('Error creating or navigating to group: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => createOrNavigateToChat(item)}
            style={styles.item}>
            <Text>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  item: {padding: 20, borderBottomWidth: 1},
});

export default ChatListScreen;

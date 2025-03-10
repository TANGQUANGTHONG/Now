import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { getDatabase, ref, onValue, update } from '@react-native-firebase/database';
import { getAuth } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

const GroupMembers = ({ route }) => {
  const { groupId } = route.params;
  const auth = getAuth();
  const db = getDatabase();
  const myId = auth.currentUser?.uid;

  const [members, setMembers] = useState([]);
  const [groupOwner, setGroupOwner] = useState(null);

  useEffect(() => {
    if (!groupId) {
      console.log("❌ Lỗi: groupId không tồn tại!");
      return;
    }

    const groupRef = ref(db, `groups/${groupId}`);

    onValue(groupRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.log("❌ Nhóm không tồn tại!");
        return;
      }

      const groupData = snapshot.val();
      console.log("🔥 Dữ liệu nhóm:", groupData);

      if (!groupData.members) {
        console.log("⚠️ Nhóm này không có thành viên nào!");
        setMembers([]);
        return;
      }

      setGroupOwner(groupData.owner); // 🛠 Cập nhật chủ nhóm

      const memberIds = Object.keys(groupData.members);
      console.log("👥 Danh sách ID thành viên:", memberIds);

      // Lấy danh sách users
      const usersRef = ref(db, `users`);
      onValue(usersRef, (usersSnapshot) => {
        if (!usersSnapshot.exists()) {
          console.log("⚠️ Không tìm thấy dữ liệu users!");
          return;
        }

        const usersData = usersSnapshot.val();
        console.log("📌 Dữ liệu users:", usersData);

        // Lọc ra user có id trùng với members của group
        const memberDetails = memberIds
          .map(memberId => usersData[memberId] ? ({
            id: memberId,
            name: usersData[memberId].name || 'Người dùng',
            avatar: usersData[memberId].avatar || 'https://example.com/default-avatar.png',
          }) : null)
          .filter(Boolean);

        console.log("✅ Danh sách thành viên sau khi xử lý:", memberDetails);
        setMembers(memberDetails);
      });
    });

  }, [groupId]);

  // Xóa thành viên (Chỉ chủ nhóm mới được xóa)
  const removeMember = async (memberId) => {
    if (myId !== groupOwner) {
      Alert.alert('Lỗi', 'Chỉ chủ nhóm mới có quyền xóa thành viên.');
      return;
    }

    // Xóa user khỏi danh sách members (Cập nhật đúng định dạng object)
    const updates = {};
    updates[`groups/${groupId}/members/${memberId}`] = null;

    await update(ref(db), updates);

    Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thành viên nhóm</Text>
      <FlatList
        data={members}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.memberName}>{item.name}</Text>

            {myId === groupOwner && item.id !== groupOwner && (
              <TouchableOpacity onPress={() => removeMember(item.id)}>
                <Icon name="trash" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default GroupMembers;

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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginVertical: 5,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
});

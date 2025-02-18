import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import database from '@react-native-firebase/database'; // Import Realtime Database
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';

const { width, height } = Dimensions.get('window');

const Setting = props => {
  const { navigation } = props;
  const auth = getAuth();
  const [users, setUsers] = useState([]);

  const logOut = () => {
    auth.signOut().then(() => {
      console.log('Đã đăng xuất');
    });
  };

  const Next_ChangeDisplayName = () => {
    navigation.navigate('ChangeDisplayName');
  };

  const fetchUsers = async () => {
    try {
      const userRef = database().ref('/users'); // Đường dẫn đến bảng users trong Realtime Database
      userRef.on('value', snapshot => {
        const usersData = snapshot.val();
        if (usersData) {
          const userList = Object.keys(usersData).map(userId => {
            const data = usersData[userId];
            return {
              id: userId,
              username: data.name ? decryptMessage(data.name) : 'Không có tên',
              email: data.email ? decryptMessage(data.email) : 'Không có email',
              img: data.Image
                ? decryptMessage(data.Image)
                : 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
            };
          });
          setUsers(userList);
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const myId = auth.currentUser?.uid;
  const filtered = users.filter(user => user.id === myId);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.textSetting}>Setting</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.rectangle}>
          <View style={styles.rectangleLine}></View>
        </View>
        <View style={styles.profile}>
          <Pressable>
            <Image
              source={{
                uri:
                  filtered.length > 0 && filtered[0].img
                    ? filtered[0].img
                    : 'https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
              }}
              style={styles.avatar}
            />
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {filtered.length > 0 && filtered[0].username
                ? filtered[0].username
                : 'không có tên'}
            </Text>
            <Text style={styles.status}>
              {filtered.length > 0 && filtered[0].email
                ? filtered[0].email
                : 'không có email'}
            </Text>
          </View>
          <Icon name="qr-code-outline" size={22} color="black" />
        </View>

        <ScrollView style={styles.list}>
          <TouchableOpacity onPress={Next_ChangeDisplayName}>
            <Option
              icon="person"
              title="Change username"
              subtitle="Privacy, security, change number"
            />
          </TouchableOpacity>

          <Option
            icon="chatbubble-ellipses-outline"
            title="Chat"
            subtitle="Chat history, theme, wallpapers"
          />
          <Option
            icon="notifications"
            title="Notifications"
            subtitle="Messages, group and others"
          />
          <Option
            icon="help"
            title="Help"
            subtitle="Help center, contact us, privacy policy"
          />
          <Option
            icon="server"
            title="Storage and data"
            subtitle="Network usage, storage usage"
          />

          <TouchableOpacity onPress={logOut}>
            <Option1 icon="exit-outline" title="Log out" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const Option = ({ icon, title, subtitle }) => (
  <View style={styles.option}>
    <View style={[styles.optionIcon]}>
      <Icon name={icon} size={20} color="#555" />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);
const Option1 = ({ icon, title, subtitle }) => (
  <View style={styles.option}>
    <View style={[styles.optionIcon]}>
      <Icon name={icon} size={20} color="red" />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle1}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    padding: height * 0.06,
    backgroundColor: '#0a0f14',
  },
  body: {
    backgroundColor: '#fff',
    padding: width * 0.05,
    borderTopLeftRadius: width * 0.1,
    borderTopRightRadius: width * 0.1,
    flex: 1,
  },
  textSetting: {
    fontSize: width * 0.05,
    fontWeight: '500',
    color: '#fff',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.03,
    backgroundColor: 'white',
    marginVertical: height * 0.01,
    borderRadius: width * 0.03,
  },
  optionIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: width * 0.04,
  },
  optionTitle: {
    color: 'black',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  optionTitle1: {
    color: 'red',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  optionSubtitle: {
    color: 'gray',
    fontSize: width * 0.03,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomLeftRadius: width * 0.05,
    borderBottomRightRadius: width * 0.05,
    padding: width * 0.03,
    marginVertical: height * 0.02,
  },
  avatar: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
  },
  profileInfo: {
    flex: 1,
    marginLeft: width * 0.04,
  },
  name: {
    color: 'black',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  status: {
    color: 'gray',
    fontSize: width * 0.035,
  },
});

export default Setting;

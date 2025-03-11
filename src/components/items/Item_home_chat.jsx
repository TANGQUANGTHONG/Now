import { Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Entypo'; 

const { width, height } = Dimensions.get('window');

const Item_home_chat = ({ data_chat, onPress, onLongPress, isPinned }) => {
  const [error, setError] = useState(false);

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} delayLongPress={300}>
      <View style={styles.container}>
        <View style={styles.container_item}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: error ? "https://example.com/default-avatar.png" : data_chat.img }}
              style={styles.img}
              onError={() => setError(true)}
            />
            <View style={styles.container_content1}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.text_name}>{data_chat.name}</Text>
              </View>
              {/* Giới hạn tin nhắn hiển thị trong 1 dòng */}
              <Text
                style={[styles.text_content, data_chat.unreadCount > 0 && styles.text_bold]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {data_chat.text}
              </Text>
            </View>
          </View>

          <View style={styles.container_content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: width * 0.01 }}>
              {/* Icon ghim nếu tin nhắn được ghim */}
              {isPinned && (
                <Icon name="pin" size={width * 0.04} color="gold" style={styles.pinIcon} />
              )}
              <Text style={styles.text_time}>{data_chat.time}</Text>
            </View>
            {/* Số lượng tin nhắn chưa đọc */}
            {data_chat.unreadCount > 0 && (
              <View style={styles.border}>
                <Text style={styles.text_notifi}>{data_chat.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Item_home_chat;

const styles = StyleSheet.create({
  img: {
    width: width * 0.13, 
    height: width * 0.13, 
    borderRadius: width * 0.065, 
  },
  container: {
    top : height * 0.02,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.025, 
    flex: 1,
  },
  container_item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  container_content: {
    flexDirection: 'column',
    marginLeft: width * 0.02, 
    alignItems: "center",
  },
  container_content1: {
    flexDirection: 'column',
    marginLeft: width * 0.03, 
    maxWidth: width * 0.5, 
  },
  text_name: {
    fontSize: width * 0.05, 
    fontWeight: '500',
    color: 'white',
  },
  text_time: {
    fontSize: width * 0.035, 
    fontWeight: '400',
    color: 'gray',
  },
  text_content: {
    fontSize: width * 0.03, 
    color: 'gray',
    maxWidth: width * 0.5, 
  },
  text_bold: {
    fontWeight: 'bold',
    color: 'white', 
  },
  border: {
    backgroundColor: '#00C608',
    width: width * 0.05, 
    height: width * 0.05, 
    borderRadius: width * 0.025, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.005, 
  },
  text_notifi: {
    color: 'white',
    fontWeight: 'bold',
  },
  pinIcon: {
    marginRight: width * 0.005, 
  },
});

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';

const Item_home_chat = ({ data_chat, onPress }) => {
  const [error, setError] = useState(false);

  return (
    <Pressable onPress={onPress}>
      <View style={styles.container}>
        {/* Hiển thị ảnh, nếu lỗi thì thay bằng ảnh mặc định */}

        <View style={styles.container_item}>
          <View style = {{flexDirection:'row', alignItems:'center'}}>
            <Image
              source={{ uri: error ? "https://example.com/default-avatar.png" : data_chat.img }}
              style={styles.img}
              onError={() => setError(true)}
            />
            {/* Thông tin chat */}
            <View style={styles.container_content1}>
              <Text style={styles.text_name}>{data_chat.name}</Text>
              <Text
                style={[styles.text_content, data_chat.unreadCount > 0 && styles.text_bold]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {data_chat.text}
              </Text>
            </View>
          </View>

          {/* Thời gian + số tin chưa đọc */}
          <View style={styles.container_content}>
            <Text style={styles.text_time}>{data_chat.time}</Text>
            {data_chat.unreadCount > 0 && (
              <View style={styles.border}>
                <Text style={styles.text_notifi}>{data_chat.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default Item_home_chat;

const styles = StyleSheet.create({
  img: {
    width: 52,
    height: 52,
    borderRadius: 50,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    flex: 1
  },
  container_item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // width: "100%",
    // marginLeft: 12,
    flex: 1
  },
  container_content: {
    flexDirection: 'column',
    marginLeft: 10,
    alignItems:"center"
  },
  container_content1: {
    flexDirection: 'column',
    marginLeft: 10,
    // alignItems:"center"
  },
  text_name: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
  },
  text_time: {
    fontSize: 12,
    fontWeight: '450',
    color: 'white',
    // marginLeft: 100,
  },
  text_content: {
    fontSize: 12,
    // fontWeight: '450',
    color: 'gray',
  },
  text_bold: {
    fontWeight: 'bold',
    color: 'white', // Chữ đậm nếu có tin chưa đọc
  },
  border: {
    backgroundColor: '#00C608',
    width: 20,
    height: 20,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: 30,
    marginTop: 10,
  },
  text_notifi: {
    color: 'white',
    fontWeight: 'bold',
  },
});

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { decryptMessage } from '../../cryption/Encryption';
const Item_home_chat = ({ data_chat, onPress }) => {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.container}>
        <Image
          source={{ uri: data_chat.img }}
          style={styles.img}
          onError={() => setError(true)}
        />
        <View style={styles.container_item}>
          <View style={styles.container_content}>
            <Text style={styles.text_name}>{data_chat.name}</Text>
            <Text style={styles.text_content}
              numberOfLines={1} // Số dòng tối đa
              ellipsizeMode="tail" // Cách hiển thị dấu 3 chấm (tail: ở cuối)
            >{data_chat.text}</Text>
          </View>
          <View style={styles.container_content}>
            <Text style={styles.text_content}>{data_chat.time}</Text>
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
  container_content: {
    flexDirection: 'column',
  },
  container: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  text_name: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  text_time: {
    fontSize: 12,
    fontWeight: '450',
    color: '#797C7B',
    marginLeft: 100,
  },
  text_content: {
    fontSize: 12,
    fontWeight: '450',
    color: '#797C7B',
  },
  container_item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginLeft: 12,
  },
  border: {
    backgroundColor: 'red',
    width: 22,
    height: 22,
    padding: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 30,
    marginTop: 10,
  },
  text_notifi: {
    color: 'white',
  },
});
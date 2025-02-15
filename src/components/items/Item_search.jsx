import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';

const Item_search = ({ data, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(data.id)}>
      <Image source={{ uri: data.img }} style={styles.img} />
      <View>
        <Text style={styles.username}>{data.username}</Text>
        <Text style={styles.email}>{data.email}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Item_search;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
});


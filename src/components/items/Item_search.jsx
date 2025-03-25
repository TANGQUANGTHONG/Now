import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';

const Item_search = ({ data, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(data.id)}>
      <Image source={{ uri: data.img }} style={styles.image} />
      <View>
        <Text style={styles.username}>{data.nickname}</Text>
        <Text style={[styles.username,{fontSize:10,fontWeight:'400'}]}>{data.username}</Text>
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
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
});


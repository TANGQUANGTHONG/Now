import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';

const Item_home_friend = props => {
  const {data} = props;
  return (
    <View style={styles.container}>
      <Image source={{uri: data.img}} style={styles.img} />
      <Text style={styles.text}>{data.name}</Text>
    </View>
  );
};

export default Item_home_friend;

const styles = StyleSheet.create({
  container: {
    height: 90,
    width: 58,
    marginRight: 20,
    alignItems: 'center',
  },
  img: {
    width: 58,
    height: 58,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'white',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 10,
  },
});

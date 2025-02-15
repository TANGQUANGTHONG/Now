import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';

const Item_search = props => {
  const {data} = props;
  console.log(data.username);
  console.log(data.img);
  return (
    <View style={styles.container}>
      <Image source={{uri: data.img}} style={styles.img} />
      <Text style={styles.text_name}>{data.username}</Text>
    </View>
  );
};

export default Item_search;

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
    alignItems:'center',
    borderBottomWidth:0.5,paddingBottom:10,
    borderColor:'#D9D9D9',
  },
  text_name: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    marginLeft:10
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

import React from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, Pressable } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import ImageGallery from "./ImageGallery";

const { width, height } = Dimensions.get("window");

const Profile = (props) => {
  const {navigation} = props
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBack}>
          <Pressable onPress={()=> navigation.goBack()}>
          <Icon name="chevron-back" size={width* 0.066} color={'gray'}/>
          </Pressable>
        </View>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.iconRow}>
          <Icon name="chatbubble-ellipses-outline" size={width * 0.06} color="white" />
          <Icon name="videocam" size={width * 0.06} color="white" />
          <Icon name="call" size={width * 0.06} color="white" />
          <Icon name="ellipsis-horizontal" size={width * 0.06} color="white" />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.rectangle}>
          <View style={styles.rectangleLine}>

          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{user.address}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{user.phone}</Text>
        </View>
        {/* Media Section */}
     
        <ImageGallery images={user.media}/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { alignItems: "center", padding: height * 0.03, backgroundColor: "#0a0f14" },
  avatar: { width: width * 0.2, height: width * 0.2, borderRadius: width * 0.1, marginBottom: height * 0.01 },
  name: { fontSize: width * 0.05, color: "white", fontWeight: "bold" },
  username: { fontSize: width * 0.035, color: "gray" },
  iconRow: { flexDirection: "row", justifyContent: "space-around", width: "60%", marginTop: height * 0.01 },
  body: { backgroundColor: "#fff", padding: width * 0.05, borderTopLeftRadius: width * 0.05, borderTopRightRadius: width * 0.05, flex: 1 },
  label: { fontSize: width * 0.035, color: "gray", marginTop: height * 0.01 },
  value: { fontSize: width * 0.04, fontWeight: "bold", color: "#333" },
  mediaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: height * 0.02 },
  viewAll: { color: "#007bff", fontWeight: "bold" },
  mediaItem: { width: width * 0.2, height: width * 0.2, borderRadius: width * 0.05, marginRight: width * 0.02, marginTop: height * 0.01 },
  section:{
    paddingVertical:  width * 0.02,
  },
  rectangle: {
    alignItems: 'center',
  },
  rectangleLine:{
    width: width * 0.1,
    borderRadius: width * 0.05,
    height: height * 0.006,
    backgroundColor: 'gray'
  },
  iconBack:{
    position: "absolute", 
    left: 10, 
    top: "10%", 
    padding: width * 0.01,
  }
});

export default Profile;

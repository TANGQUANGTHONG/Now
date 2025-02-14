import React from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, Pressable, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");



const Setting = (props) => {
  const {navigation} = props
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      
        <Text style={styles.textSetting}>Setting</Text>
      
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.rectangle}>
          <View style={styles.rectangleLine}>

          </View>
        </View>
        <View style={styles.profile}>
          <Pressable >
        <Image source={{ uri: "https://cdn.pixabay.com/photo/2024/02/26/14/13/businessman-8598067_1280.jpg" }} style={styles.avatar} />
        </Pressable>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Nazrul Islam</Text>
          <Text style={styles.status}>Never give up 💪</Text>
        </View>
        <Icon name="qr-code-outline" size={22} color="black" />
      </View>

        <ScrollView style={styles.list}>
        <Option icon="person" title="Account" subtitle="Privacy, security, change number" />
        <Option icon="chatbubble-ellipses-outline" title="Chat" subtitle="Chat history, theme, wallpapers" />
        <Option icon="notifications" title="Notifications" subtitle="Messages, group and others" />
        <Option icon="help" title="Help" subtitle="Help center, contact us, privacy policy" />
        <Option icon="server" title="Storage and data" subtitle="Network usage, storage usage" />
        <Option icon="person-add" title="Invite a friend" />
      </ScrollView>
      </View>
    </View>
  );
};

const Option = ({ icon, title, subtitle }) => (
  <TouchableOpacity style={styles.option}>
    <View style={styles.optionIcon}>
      <Icon name={icon} size={20} color="#555" />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  header: { 
    alignItems: "center", 
    padding: height * 0.06, 
    backgroundColor: "#0a0f14" 
  },
  body: { 
    backgroundColor: "#fff", 
    padding: width * 0.05, 
    borderTopLeftRadius: width * 0.1, 
    borderTopRightRadius: width * 0.1, 
    flex: 1 
  },
  label: { 
    fontSize: width * 0.035, 
    color: "gray", 
    marginTop: height * 0.01 
  },
  value: { 
    fontSize: width * 0.04, 
    fontWeight: "bold", 
    color: "#333" 
  },
  section: {
    paddingVertical: width * 0.02,
  },
  rectangle: {
    alignItems: 'center',
  },
  rectangleLine: {
    width: width * 0.1,
    borderRadius: width * 0.05,
    height: height * 0.006,
    backgroundColor: 'gray',
  },
  textSetting: {
    fontSize: width * 0.05,
    fontWeight: '500',
    color: '#fff' // Add color for better contrast
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: width * 0.03, 
    backgroundColor: "white",
    marginVertical: height * 0.01, 
    borderRadius: width * 0.03,
  },
  optionIcon: {
    width: width * 0.1, 
    height: width * 0.1, 
    borderRadius: width * 0.05, 
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    marginLeft: width * 0.04,
  },
  optionTitle: {
    color: "black",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  optionSubtitle: {
    color: "gray",
    fontSize: width * 0.03,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
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
    color: "black",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  status: {
    color: "gray",
    fontSize: width * 0.035,
  },
});


export default Setting;

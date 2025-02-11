import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const Setting = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <Image source={{ uri: "https://cdn.pixabay.com/photo/2024/02/26/14/13/businessman-8598067_1280.jpg" }} style={styles.avatar} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Nazrul Islam</Text>
          <Text style={styles.status}>Never give up 💪</Text>
        </View>
        <Icon name="qrcode" size={22} color="black" />
      </View>

      {/* Options List */}
      <ScrollView style={styles.list}>
        <Option icon="user-lock" title="Account" subtitle="Privacy, security, change number" />
        <Option icon="comment" title="Chat" subtitle="Chat history, theme, wallpapers" />
        <Option icon="bell" title="Notifications" subtitle="Messages, group and others" />
        <Option icon="question-circle" title="Help" subtitle="Help center, contact us, privacy policy" />
        <Option icon="database" title="Storage and data" subtitle="Network usage, storage usage" />
        <Option icon="user-plus" title="Invite a friend" />
      </ScrollView>
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  profile: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    color: "gray",
    fontSize: 14,
  },
  
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 15,
  },
  optionTitle: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionSubtitle: {
    color: "gray",
    fontSize: 12,
  },
});

export default Setting;

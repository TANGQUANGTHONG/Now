import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, Modal, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const ImageGallery = ({ images }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const displayedImages = images.slice(0, 4);
  const remainingCount = images.length - 4;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Media Shared</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedImages}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.imageContainer}>
            <Image source={{ uri: item }} style={styles.image} />
            {index === 3 && remainingCount > 0 && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>{remainingCount}+</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <FlatList
            data={images}
            numColumns={3}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.modalImage} />
            )}
          />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default ImageGallery;

const styles = StyleSheet.create({
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: height * 0.015, // Tỷ lệ theo chiều cao màn hình
  },
  title: { 
    fontSize: width * 0.045, // Kích thước chữ theo chiều rộng màn hình
    fontWeight: "bold", 
    color: 'black' 
  },
  viewAll: { 
    color: "green", 
    fontWeight: "bold", 
    fontSize: width * 0.04, 
  },
  imageContainer: { 
    marginRight: width * 0.025, 
    borderRadius: width * 0.025, 
    overflow: "hidden" 
  },
  image: { 
    width: width * 0.2, 
    height: width * 0.2, 
    borderRadius: width * 0.025, 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  overlayText: { 
    color: "white", 
    fontSize: width * 0.05, 
    fontWeight: "bold" 
  },
  modalContainer: { 
    flex: 1, 
    padding: width * 0.05, 
    backgroundColor: "#fff" 
  },
  modalImage: { 
    width: width / 3 - width * 0.06, 
    height: width / 3 - width * 0.06, 
    margin: width * 0.015, 
    borderRadius: width * 0.02 
  },
  closeButton: { 
    padding: height * 0.02, 
    backgroundColor: "black", 
    borderRadius: width * 0.03, 
    marginTop: height * 0.02, 
    alignSelf: "center" 
  },
  closeButtonText: { 
    color: "white", 
    fontSize: width * 0.045, 
    fontWeight: "bold" 
  }
});

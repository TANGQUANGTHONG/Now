import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Camera, useCameraDevices, useCodeScanner } from "react-native-vision-camera";
import { PermissionsAndroid, Platform } from "react-native";

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const devices = useCameraDevices();
  const device = devices.back || devices.front; // Chọn camera sau hoặc trước

  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Yêu cầu quyền Camera",
            message: "Ứng dụng cần quyền Camera để quét mã QR",
            buttonNeutral: "Hỏi lại sau",
            buttonNegative: "Từ chối",
            buttonPositive: "Đồng ý",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert(
            "Quyền bị từ chối",
            "Bạn cần cấp quyền camera để quét QR.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      }
    };

    requestCameraPermission();
  }, []);

  // 📌 Xử lý khi quét mã QR thành công
  const codeScanner = useCodeScanner({
    codeTypes: ["qr"], // Chỉ quét QR Code
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const scannedData = codes[0].value; // Lấy dữ liệu từ mã QR
        console.log("📌 Mã QR đã quét:", scannedData);

        if (scannedData.startsWith("chatapp://chat/")) {
          const userId = scannedData.replace("chatapp://chat/", "");
          navigation.navigate("ChatScreen", { userId });
        } else {
          Alert.alert("Lỗi", "Mã QR không hợp lệ!");
        }
      }
    },
  });

  if (hasPermission === null) {
    return <Text>Đang kiểm tra quyền truy cập camera...</Text>;
  }

  if (!hasPermission) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Không có quyền truy cập camera</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "blue", marginTop: 10 }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return <Text>Không tìm thấy thiết bị camera khả dụng!</Text>;
  }

  return (
    <Camera
      style={{ flex: 1 }}
      device={device}
      isActive={true}
      codeScanner={codeScanner} // 📌 Kích hoạt scanner để quét QR
    />
  );
};

export default QRScannerScreen;

import "react-native-get-random-values"; // Fix lỗi tạo số ngẫu nhiên
import CryptoJS from "crypto-js";

const SECRET_KEY = "my-super-secret-key-123456"; // Bạn có thể thay bằng khóa bảo mật mạnh hơn

// Tạo secretKey từ 2 userId
export const generateRoomKey = (userA, userB) => {
  // Sắp xếp ID theo thứ tự alphabet để đảm bảo consistency
  const combinedKey = [userA, userB].sort().join("");

  // Tạo secretKey bằng SHA-256
  return CryptoJS.SHA256(combinedKey).toString();
};

// Hàm mã hóa tin nhắn
export const encryptMessage = (message) => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

// Hàm giải mã tin nhắn
export const decryptMessage = (encryptedMessage) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

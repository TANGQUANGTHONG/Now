import "react-native-get-random-values"; // Fix lỗi tạo số ngẫu nhiên
import CryptoJS from "crypto-js";

const SECRET_KEY = "my-super-secret-key-123456"; // Bạn có thể thay bằng khóa bảo mật mạnh hơn

// Hàm mã hóa tin nhắn
export const encryptMessage = (message) => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};


// Hàm giải mã tin nhắn
export const decryptMessage = (encryptedMessage) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

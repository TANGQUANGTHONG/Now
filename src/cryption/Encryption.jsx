import "react-native-get-random-values";
import CryptoJS from "crypto-js";

// 🔹 Mã hóa userId & myId thành SecretKey cho mỗi phòng chat
export const generateSecretKey = (userId, myId) => {
  const sortedIds = [userId, myId].sort().join("_"); // Đảm bảo thứ tự luôn giống nhau
  return CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(sortedIds));
};

// 🔹 Mã hóa chatId để không chứa ký tự đặc biệt
export const encodeChatId = (userId, myId) => {
  const rawChatId = [userId, myId].sort().join("_"); // Đảm bảo thứ tự ID luôn giống nhau
  const hashedChatId = CryptoJS.SHA256(rawChatId).toString(CryptoJS.enc.Base64);
  
  // Loại bỏ ký tự đặc biệt (+, /, =) để đảm bảo chatId không bị lỗi
  return hashedChatId.replace(/\+/g, 'A').replace(/\//g, 'B').replace(/=/g, '');
};

// 🔹 Mã hóa tin nhắn
export const encryptMessage = (message, userId, myId) => {
  const secretKey = generateSecretKey(userId, myId);
  return CryptoJS.AES.encrypt(message, secretKey).toString();
};

// 🔹 Giải mã tin nhắn
export const decryptMessage = (encryptedMessage, userId, myId) => {
  try {
    const secretKey = generateSecretKey(userId, myId);
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    // console.error("Giải mã lỗi:", error);
    return "❌ Lỗi giải mã";
  }
};


// // 🔹 Mã hóa userId (Bảo mật ID của người dùng)
// export const encryptUserId = (userId) => {
//   return CryptoJS.AES.encrypt(userId, "SuperSecureKey").toString();
// };

// // 🔹 Giải mã userId (Lấy lại ID user đã mã hóa)
// export const decryptUserId = (encryptedUserId) => {
//   try {
//     const bytes = CryptoJS.AES.decrypt(encryptedUserId, "SuperSecureKey");
//     return bytes.toString(CryptoJS.enc.Utf8);
//   } catch (error) {
//     console.error("Lỗi giải mã userId:", error);
//     return null;
//   }
// };+

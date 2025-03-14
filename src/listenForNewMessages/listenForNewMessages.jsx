import { useEffect } from 'react';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { decryptMessage, generateSecretKey } from '../cryption/Encryption';

const useListenForNewMessages = () => {
  useEffect(() => {
    const myId = auth().currentUser?.uid;
    if (!myId) return;

    const chatsRef = database().ref('/chats');

    const handleNewMessage = async (snapshot, chatId, otherUserId) => {
      if (!snapshot.exists()) return;

      try {
        const msgId = snapshot.key;
        const msgData = snapshot.val();

        if (!msgData || msgData.deleted) return; // Bỏ qua nếu tin nhắn đã bị xóa

        const secretKey = generateSecretKey(myId, otherUserId);
        const newMessage = {
          id: msgId,
          senderId: msgData.senderId,
          text: msgData.text ? decryptMessage(msgData.text, secretKey) : '📷 Ảnh mới',
          imageUrl: msgData.imageUrl || null,
          timestamp: msgData.timestamp,
          selfDestruct: msgData.selfDestruct || false,
          selfDestructTime: msgData.selfDestructTime || null,
          seen: msgData.seen || {},
          deleted: msgData.deleted || false,
          isLocked: msgData.selfDestruct,
        };

        // Lấy tin nhắn cũ từ AsyncStorage
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const oldMessages = storedMessages ? JSON.parse(storedMessages) : [];

        // Kiểm tra xem tin nhắn đã tồn tại chưa
        const isMessageExist = oldMessages.some(msg => msg.id === newMessage.id);
        if (!isMessageExist) {
          const updatedMessages = [...oldMessages, newMessage];
          await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
          console.log(`✅ Tin nhắn ${msgId} đã được thêm vào local`);
        }

        // Kiểm tra và xóa tin nhắn nếu cả hai đã seen
        checkAndDeleteMessage(chatId, msgId, newMessage.seen, myId, otherUserId);
      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn mới:', error);
      }
    };

    const checkAndDeleteMessage = async (chatId, msgId, seen, myId, otherUserId) => {
      if (seen[myId] && seen[otherUserId]) {
        setTimeout(async () => {
          await database().ref(`/chats/${chatId}/messages/${msgId}`).remove();
          console.log(`🗑 Tin nhắn ${msgId} đã bị xóa trên Firebase`);
        }, 604800000); // 1 tuần
      }
    };

    const handleChatUpdate = snapshot => {
      if (!snapshot.exists()) return;

      const chatData = snapshot.val();
      const chatId = snapshot.key;

      if (!chatData.users || !chatData.messages || !chatData.users[myId]) return;

      const otherUserId = Object.keys(chatData.users).find(uid => uid !== myId);
      if (!otherUserId) return;

      const messagesRef = database().ref(`/chats/${chatId}/messages`);

      // Lắng nghe tin nhắn mới
      messagesRef.on('child_added', snap => handleNewMessage(snap, chatId, otherUserId));

      // Lắng nghe sự thay đổi của `seen`
      messagesRef.on('child_changed', snap => {
        const msgData = snap.val();
        if (msgData?.seen) {
          checkAndDeleteMessage(chatId, snap.key, msgData.seen, myId, otherUserId);
        }
      });
    };

    chatsRef.on('child_added', handleChatUpdate); // Khi có cuộc trò chuyện mới
    chatsRef.on('child_changed', handleChatUpdate); // Khi có tin nhắn mới trong cuộc trò chuyện

    return () => {
      chatsRef.off('child_added', handleChatUpdate);
      chatsRef.off('child_changed', handleChatUpdate);
    };
  }, []);

  return null;
};

export default useListenForNewMessages;

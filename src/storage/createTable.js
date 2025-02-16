import firestore from '@react-native-firebase/firestore';

export const createGroup = async (groupName, members) => {
  try {
    const groupRef = await firestore().collection('groups').add({
      groupName,
      members,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    console.log('Group created with ID: ', groupRef.id);
    return groupRef.id;
  } catch (error) {
    console.log('Error creating group: ', error);
  }
};
export const sendMessage = async (groupId, senderId, text) => {
  if (!text.trim()) return;

  try {
    await firestore().collection('messages').add({
      groupId,
      senderId,
      text,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

export const unsubscribe = firestore()
  .collection('messages')
  .where('groupId', '==', groupId)
  .orderBy('timestamp', 'asc')
  .onSnapshot(snapshot => {
    const msgs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(msgs);
  });

return () => unsubscribe();

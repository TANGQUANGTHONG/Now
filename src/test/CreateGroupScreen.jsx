import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import {
  collection,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import {firestore} from './firebaseConfig';

const CreateGroupScreen = ({navigation}) => {
  const [groupName, setGroupName] = useState('');

  const createGroup = async () => {
    try {
      await addDoc(collection(firestore, 'groups'), {
        groupName,
        createdAt: serverTimestamp(),
        members: [],
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />
      <TouchableOpacity onPress={createGroup} style={styles.button}>
        <Text style={styles.buttonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 20},
  input: {borderWidth: 1, padding: 10, marginBottom: 10},
  button: {backgroundColor: '#007bff', padding: 20, alignItems: 'center'},
  buttonText: {color: '#fff'},
});

export default CreateGroupScreen;

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import database from '@react-native-firebase/database';
import { encryptMessage, decryptMessage } from '../../cryption/Encryption';

const NicknameModal = ({ visible, onClose, googleName, onSave }) => {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(false);
  
    const generateRandomNickname = (name) => {
      const noAccents = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toLowerCase();
      const randomNum = Math.floor(Math.random() * 1000);
      const suffix = ['cool', 'xyz', 'pro'][Math.floor(Math.random() * 3)];
      const base = noAccents.length > 10 ? noAccents.slice(0, 10) : noAccents;
      return `${base}${randomNum}.${suffix}`;
    };
  
    const checkNicknameUniqueness = async (nick) => {
      if (!nick.trim()) return false;
      try {
        const usersRef = database().ref('/users');
        const snapshot = await usersRef.once('value');
        let isUnique = true;
        if (snapshot.exists()) {
          const users = snapshot.val();
          for (const userId in users) {
            const user = users[userId];
            if (user.nickname) {
              const decryptedNickname = decryptMessage(user.nickname);
              if (decryptedNickname.toLowerCase() === nick.toLowerCase()) {
                isUnique = false;
                break;
              }
            }
          }
        }
        return isUnique;
      } catch (error) {
        console.log('Error checking nickname:', error);
        return false;
      }
    };
  
    const handleRandomNickname = () => {
      const randomNick = generateRandomNickname(googleName);
      setNickname(randomNick);
      setError('');
    };
  
    const handleSave = async () => {
      if (!nickname.trim()) {
        setError('Nickname không được để trống');
        return;
      }
      if (nickname.length > 20) {
        setError('Nickname không được dài quá 20 ký tự');
        return;
      }
  
      setIsChecking(true);
      const isUnique = await checkNicknameUniqueness(nickname);
      setIsChecking(false);
  
      if (!isUnique) {
        setError('Nickname đã tồn tại, vui lòng chọn nickname khác');
        return;
      }
  
      onSave(nickname);
      setNickname('');
      setError('');
      onClose();
    };
  
    const handleCancel = async () => {
      try {
        await auth().signOut(); // Đăng xuất nếu hủy
        console.log('User signed out due to cancellation');
      } catch (error) {
        console.log('Error signing out:', error);
      }
      setNickname('');
      setError('');
      onClose();
    };
  
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hoàn thiện hồ sơ</Text>
            <Text style={styles.modalSubtitle}>Vui lòng nhập nickname (tối đa 20 ký tự):</Text>
  
            <TextInput
              style={[styles.input, error && styles.errorInput]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Nhập nickname"
              placeholderTextColor="gray"
              maxLength={20}
              autoCapitalize="none"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
  
            <TouchableOpacity style={styles.randomButton} onPress={handleRandomNickname}>
              <Text style={styles.randomButtonText}>Tạo ngẫu nhiên</Text>
            </TouchableOpacity>
  
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isChecking}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorInput: {
    borderColor: '#FF4D4D',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginTop: 5,
  },
  randomButton: {
    backgroundColor: '#438875',
    padding: 10,
    borderRadius: 8,
    marginVertical: 15,
  },
  randomButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#4A4A4A',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#99F2C8',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});

export default NicknameModal;
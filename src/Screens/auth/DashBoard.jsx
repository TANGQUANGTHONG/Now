import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { useNavigation } from '@react-navigation/native';
import { decryptMessage } from '../../cryption/Encryption';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const DashBoard = () => {
    const [name, setName] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        const user = auth().currentUser;
        if (user) {
            database()
                .ref(`/users/${user.uid}`)
                .once('value')
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        setName(decryptMessage(userData.name));
                    }
                })
                .catch(error => console.error('Lỗi khi lấy dữ liệu:', error));
        }
    }, []);

    const handleLogout = async () => {
        try {
            await auth().signOut();
            
        } catch (error) {
            Alert.alert('Lỗi', 'Đăng xuất thất bại!');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Xin chào, {name || ''}!, Vui lòng xác thực email trước khi đăng nhập</Text>
            <Button title="Đăng xuất" onPress={handleLogout} color="red" />
        </View>
    );
};

export default DashBoard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

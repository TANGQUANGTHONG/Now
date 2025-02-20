import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { useNavigation } from '@react-navigation/native';
import { decryptMessage } from '../../cryption/Encryption';

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
            <View style={styles.card}>
                <Text style={styles.title}>Xin chào, {name || 'User'}!</Text>
                <Text style={styles.subtitle}>Vui lòng xác thực email trước khi đăng nhập</Text>
                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Tôi đã xác minh</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default DashBoard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
        width: '85%',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#002DE3',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});

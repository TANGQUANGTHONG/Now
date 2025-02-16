import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const ChangePassWord = (props) => {
    const { navigation } = props;
    const me = useSelector(state => state.app.user);


    const [newPass, setNewPass] = useState('');
    const [currentPass, setCurrentPass] = useState('');
    const [RePass, setRepass] = useState('');
    const [btnState, setBtnState] = useState(false);
    const [isChecked, setIsChecked] = useState(false);


    useEffect(() => {
        if (newPass.trim() && currentPass.trim() && RePass.trim()) {
            setBtnState(true);
        } else {
            setBtnState(false);
        }
    }, [newPass, currentPass, RePass]);

    return (
        <View style={styles.container}>
            <Pressable onPress={() => navigation.goBack()}>
                <Icon style={styles.iconBack} name="angle-left" size={width * 0.08} color="black" />
            </Pressable>
            <Text>{me.first_name} {me.last_name}</Text>
            <Text style={styles.label}>Thay đổi mật khẩu </Text>
            <Text style={styles.label2}>Mật khẩu của bạn phải có tối thiểu 6 ký tự, đồng thời bao gồm cả chữ số, chữ cái và ký tự đặt biệt (!$@%).</Text>


            <View style={styles.inputContainer}>
                <TextInput
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    placeholderTextColor={'#8C96A2'}
                    placeholder="Mật khẩu hiện tại"
                    style={styles.input}
                    secureTextEntry
                />

            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    value={newPass}
                    onChangeText={setNewPass}
                    placeholderTextColor={'#8C96A2'}
                    placeholder="Mật khẩu mới"
                    style={styles.input}
                    secureTextEntry
                />

            </View>



            <View style={styles.inputContainer}>
                <TextInput
                    value={RePass}
                    onChangeText={setRepass}
                    placeholderTextColor={'#8C96A2'}
                    placeholder="Nhập lại mật khẩu mới"
                    style={styles.input}
                    secureTextEntry
                />
            </View>
            <View style={styles.passInfoContainer}>
                <Pressable onPress={() => navigation.navigate('FindWithEmail')}>
                <Text style={styles.textBlue}>Bạn quên mật khẩu ư?</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                    <Pressable onPress={() => setIsChecked(!isChecked)} style={{ marginRight: width * 0.02 }}>
                        <Icon name={isChecked ? "check-square" : "square-o"} size={22} color="black" />
                    </Pressable>
                    <Text>Đăng xuất khỏi các thiết bị khác. Hãy chọn mục này nếu người khác từng dùng tài khoản của bạn</Text>
                </View>
            </View>


            <Pressable
                style={btnState ? styles.button : styles.buttonOpacity}
                onPress={() => {
                    
                }}
                disabled={!btnState}
            >
                <Text style={styles.buttonText}>Đổi mật khẩu</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: width * 0.04,
        backgroundColor: '#f0f4ff',
    },
    iconBack: {
        marginVertical: height * 0.02,
    },
    label: {
        color: 'black',
        fontSize: height * 0.03,
        fontWeight: 'bold',
        marginBottom: height * 0.01,
    },
    label2: {
        fontSize: height * 0.018,
        color: '#1C2931',
        fontWeight: '450',
        marginBottom: height * 0.02,
    },
    inputDate: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: width * 0.03,
        padding: height * 0.015,
        backgroundColor: '#fff',
        marginVertical: height * 0.01,
    },
    button: {
        position: 'absolute',
        bottom: width * 0.04,
        left: 0,
        right: 0,
        marginHorizontal: width * 0.03,
        marginVertical: height * 0.02,
        backgroundColor: '#0064E0',
        paddingVertical: height * 0.015,
        borderRadius: width * 0.1,
        alignItems: 'center',
    },
    buttonOpacity: {
        position: 'absolute',
        bottom: width * 0.04,
        left: 0,
        right: 0,
        marginHorizontal: width * 0.03,
        marginVertical: height * 0.02,
        backgroundColor: '#0064E0',
        paddingVertical: height * 0.015,
        borderRadius: width * 0.1,
        alignItems: 'center',
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: width * 0.045,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: width * 0.03,
        paddingHorizontal: width * 0.04,
        backgroundColor: '#FFFFFF',
        marginBottom: height * 0.015,
    },
    input: {
        flex: 1,
        fontSize: width * 0.04,
        color: 'black',
    },
    eyeIcon: {
        marginLeft: width * 0.02,
    },
    passInfoContainer: {
        paddingVertical: width * 0.01,
        flexDirection: 'column',
        paddingHorizontal: width * 0.02,

    },
    textBlue: {
        color: '#0064E0',
    }
});

export default ChangePassWord;

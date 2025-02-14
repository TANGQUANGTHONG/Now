import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SingleS = StyleSheet.create({
    container: {
        flex: 1
    },
    avatar: {
        width: width * 0.13, // Tỉ lệ 13% của chiều rộng màn hình
        height: width * 0.13, // Tỉ lệ 13% của chiều rộng màn hình
        borderRadius: (width * 0.13) / 2 // Đảm bảo hình tròn
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: width * 0.05, // Tỉ lệ 5% của chiều rộng màn hình
        marginVertical: height * 0.02 // Tỉ lệ 2% của chiều cao màn hình
    },
    boxText: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: width * 0.025 // Tỉ lệ 2.5% của chiều rộng màn hình
    },
    txtNameHeader: {
        color: 'black',
        fontSize: width * 0.05, // Font size theo tỉ lệ 5% của chiều rộng màn hình
        fontWeight: 'bold'
    },
    body: {
        marginHorizontal: width * 0.05, // Tỉ lệ 5% của chiều rộng màn hình
        marginVertical: height * 0.02 // Tỉ lệ 2% của chiều cao màn hình
    },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: height * 0.02, // Tỉ lệ 2% của chiều cao màn hình
        bottom: 0,
        backgroundColor: 'blue',
    },
    boxbtnTextInput: {},
    input: {
        backgroundColor: 'white',
        padding: height * 0.015, // Padding theo tỉ lệ 1.5% của chiều cao màn hình
        flex: 1,
        borderRadius: 20,
        marginHorizontal: width * 0.025 // Tỉ lệ 2.5% của chiều rộng màn hình
    }
});

export default SingleS;

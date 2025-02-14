import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Chat2 = (props) => {
    const { data2 } = props
    return (
        <View>
            {
                data2.message.map((item, index) => {
                    return (
                        <View key={index}>
                            <Text style={styles.containerChat}>{item.message}</Text>
                        </View>
                    )
                })
            }
        </View>
    )
}

export default Chat2

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        // alignItems: 'center'
    },
    name: {
        marginLeft: 10,
        fontSize: 15,
        fontWeight: 'bold',
        color: 'black'
    },
    containerChat: {
        marginLeft: 50,
        marginBottom: 5,
        backgroundColor: '#afbef3', 
        padding: 10,
        borderRadius: 10, // Bo góc cho đẹp
        maxWidth: '80%', // Giới hạn độ rộng của tin nhắn
        alignSelf: 'flex-end', // Giúp background chỉ bao quanh nội dung tin nhắn,
        color: 'black'
    }
})
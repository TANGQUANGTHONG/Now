import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ChatGroup1 = (props) => {
    const { data } = props
    return (
        <View>
            <View style={styles.container}>
                <Image source={{ uri: data.image }} style={{ width: 40, height: 40, borderRadius: 50 }} />
                <Text style={styles.name}>{data.name}</Text>
            </View>
            {/* <View>
                <Text style={styles.containerChat}>{data.message[0].message}</Text>
            </View> */}
            {
                data.message.map((item, index) => {
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

export default ChatGroup1

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
        alignSelf: 'flex-start', // Giúp background chỉ bao quanh nội dung tin nhắn,
        color: 'black'
    }
    
})
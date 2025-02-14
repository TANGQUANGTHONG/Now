import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import SingleS from '../../Styles/Chat/SingleS'
import Icon from 'react-native-vector-icons/Ionicons'
import Chat from '../../components/chat_single/Chat'
import Chat2 from '../../components/chat_single/Chat2'
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
const Single = (props) => {
    const {navigation} = props
    const data = [
        {
            id: 1,
            name: 'Alex Linderson',
            message: [
                {
                    message: 'Hello !!'
                },
                {
                    id: 2,
                    message: 'How are you?'
                },
                {
                    id: 3,
                    message: 'Long time no see'
                },
            ],
            image: "https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__"
        }
    ]

    const data2 = [
        {
            id: 1,
            name: 'Kenny',
            message: [
                {
                    message: 'Hi'
                },
                {
                    id: 2,
                    message: "I'm fine and you?"
                },
            ],
            image: "https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__"
        }
    ]

    const footer = () => {
        return (
            <View style={{ alignSelf: 'flex-start', width: '100%', marginTop: 20 }}>
                <FlatList
                    data={data2}
                    renderItem={({ item }) => <Chat2 data2={item} />}
                    keyExtractor={item => item.id.toString()}
                />
            </View>
        )
    }

    return (
        <View style={SingleS.container}>
            {/* Header */}
            <View style={{ backgroundColor: "white" }}>
                <View style={SingleS.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={25} color="black" />
                        </Pressable>
                        <Pressable onPress={()=> navigation.navigate('Profile')}>
                        <View style={SingleS.boxText}>
                            <Image style={SingleS.avatar} source={{ uri: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',          }} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={SingleS.txtNameHeader}>Alex Linderson</Text>
                                <Text style={{ fontSize: 13 }}>Active now</Text>
                            </View>
                        </View>
                        </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="call-outline" size={25} color="black" style={{ marginRight: 10 }} />
                        <Icon name="videocam-outline" size={25} color="black" />
                    </View>
                </View>
            </View>

            {/* Body */}
            <FlatList
                data={data}
                renderItem={({ item }) => <Chat data={item} />}
                keyExtractor={item => item.id.toString()}
                ListFooterComponent={footer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 20, marginHorizontal: 20 }}
            />


            {/* Input Box */}
            <View style={SingleS.boxbtnTextInput}>
                <View style={{
                    marginHorizontal: 20,
                    marginVertical: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Icon name="attach" size={25} color="black" />
                    <TextInput
                        placeholder="Write your message"
                        style={SingleS.input}
                        multiline={true}
                    />
                    <Icon name="send" size={25} color="black" />
                </View>
            </View>
        </View>
    )
}

export default Single

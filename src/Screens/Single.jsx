import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import SingleS from '../Styles/Chat/SingleS'
import Icon from 'react-native-vector-icons/Ionicons'
import Chat from '../components/Chat'
import Chat2 from '../components/Chat2'
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
const Single = () => {

    const data = [
        {
            id: 1,
            name: 'Jhon Doe',
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
            image: "https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
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
            image: "https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
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
                        <Icon name="arrow-back" size={25} color="black" />
                        <View style={SingleS.boxText}>
                            <Image style={SingleS.avatar} source={require('../../assest/images/person.jpg')} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={SingleS.txtNameHeader}>John Doe</Text>
                                <Text style={{ fontSize: 13 }}>Active now</Text>
                            </View>
                        </View>
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

import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Chat from '../../components/chat_single/Chat'
import Chat2 from '../../components/chat_single/Chat2'
import ChatGroup1 from '../../components/chat_group/ChatGroup1'
import ChatGroup2 from '../../components/chat_group/ChatGroup2'
import GroupS from '../../Styles/Chat/GroupS'
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
const Group = () => {

  const data = [
    {
      id: 1,
      name: 'Jhon Abraham',
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
  const data3 = [
    {
      id: 1,
      name: 'Kenny',
      message: [
        {
          message: 'Hello everyone!!'
        },
        {
          id: 2,
          message: '?'
        },
        {
          id: 3,
          message: 'Long time no see'
        },
      ],
      image: "https://t3.ftcdn.net/jpg/02/99/04/20/360_F_299042079_vGBD7wIlSeNl7vOevWHiL93G4koMM967.jpg"
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
          renderItem={({ item }) => <ChatGroup2 data2={item} />}
          keyExtractor={item => item.id.toString()}
        />
        <FlatList
          style={{ marginTop: 20 }}
          data={data3}
          renderItem={({ item }) => <ChatGroup1 data={item} />}
          keyExtractor={item => item.id.toString()}
        />
      </View>
    )
  }

  return (
    <View style={GroupS.container}>
      {/* Header */}
      <View style={{ backgroundColor: "white" }}>
        <View style={GroupS.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={25} color="black" />
            <View style={GroupS.boxText}>
              <Image style={GroupS.avatar} source={require('../../../assest/images/group.jpg')} />
              <View style={{ marginLeft: 10 }}>
                <Text style={GroupS.txtNameHeader}>Team Align</Text>
                <Text style={{ fontSize: 13 }}>3 members, 2 online</Text>
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
        renderItem={({ item }) => <ChatGroup1 data={item} />}
        keyExtractor={item => item.id.toString()}
        ListFooterComponent={footer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 20, marginHorizontal: 20 }}
      />


      {/* Input Box */}
      <View style={GroupS.boxbtnTextInput}>
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
            style={GroupS.input}
            multiline={true}
          />
          <Icon name="send" size={25} color="black" />
        </View>
      </View>
    </View>
  )
}

export default Group

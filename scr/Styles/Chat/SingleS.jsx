import { StyleSheet, Text, View } from 'react-native'
import React from 'react'


const SingleS = StyleSheet.create({
    container: {
        flex: 1
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 50
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginVertical: 20
    },
    boxText: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    txtNameHeader: {
        color: 'black',
        fontSize: 20,
        fontWeight: 'bold'
    },
    body: {
        marginHorizontal: 20,
        marginVertical: 20
    },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        // position: 'absolute',
        bottom: 0,
        backgroundColor: 'blue',
    },
    boxbtnTextInput: {
        
    },
    input:{
        backgroundColor: 'white',
        padding:10,
        flex:1,
        borderRadius: 20,
        marginHorizontal: 10
    }
})

export default SingleS


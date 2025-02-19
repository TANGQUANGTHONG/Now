import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import { connectDb, getChatsFromSQLite } from './src/storage/SQLiteService';
import { pushNotification } from './src/notification/Notification';



const App = () => {
  pushNotification(); 

  const [chats, setChats] = useState([]); 

  // useEffect(() => {
  //   connectDb().then(() => {
  //     getChatsFromSQLite((data) => {
  //       console.log('Dữ liệu lấy từ SQLite:\n', JSON.stringify(data, null, 2));
  //       setChats(data);
  //     });
  //   });
  // }, []);

  // useEffect(() => {
  //   PushNotification.localNotification({
  //     channelId: 'default-channel',
  //     title: ' Tin nhắn mới!',
  //     message: 'Đây là thông báo test!', // Cần có `message`
  //     playSound: true,
  //     soundName: 'default',
  //   });
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppNavigation />
    </SafeAreaView>
  );
};

export default App;
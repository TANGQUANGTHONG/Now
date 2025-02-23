import React, { useEffect } from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import { configurePushNotification, listenForNewMessages } from './src/notification/Notification';
import {saveCurrentUserAsyncStorage,saveUserSendAsyncStorage,saveChatsAsyncStorage, getAllChatsAsyncStorage, getAllSavedUsersAsyncStorage,getAllUsersFromUserSend,getUserFromUserSendById } from './src/storage/Storage';

const App = () => {
  // Bật thông báo khi app khởi động
  useEffect(() => {
    configurePushNotification();
  }, []);

  // Lắng nghe tin nhắn mới (đưa vào useEffect để tránh gọi nhiều lần)
  useEffect(() => {
    listenForNewMessages();
  }, []);

  // Lưu thông tin user vào AsyncStorage
    useEffect(() => {
      saveCurrentUserAsyncStorage();
      saveUserSendAsyncStorage();
      saveChatsAsyncStorage
   }, []); 


  return (
    <>
      <AppNavigation />
    </>
  );
};

export default App;
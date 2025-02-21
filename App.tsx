import React, { useEffect, useState } from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import { configurePushNotification, listenForNewMessages } from './src/notification/Notification';
import { fetchChats,fetchUsers,getUsers, getChats } from './src/storage/Storage';


const App = () => {
// yêu cầu bật thông báo
  useEffect(() => {
    configurePushNotification();
  }, []);
// push thông báo khi có tin nhắn 
  listenForNewMessages()



// lấy data  
const [chats, setChats] = useState([]);
const [users, setUsers] = useState([]);
getUsers()
getChats();

useEffect(() => {
  const loadData = async () => {
    try {
      // Lấy dữ liệu từ AsyncStorage trước
      const storedUsers = await fetchUsers();
      const storedChats = await fetchChats();
      setUsers(storedUsers);
      setChats(storedChats);

      // Sau đó cập nhật từ Firebase
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);

      const updatedChats = await getChats();
      setChats(updatedChats);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    }
  };

  loadData();
}, []);




  return (
   <>
      <AppNavigation />
      </>
        );
};

export default App;
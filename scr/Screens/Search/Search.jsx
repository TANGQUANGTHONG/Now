<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState, useRef} from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_home_friend from '../../Styles/Home_Search/Item_home_friend';
import Item_home_chat from '../../Styles/Home_Search/Item_home_chat';
import { oStackHome } from '../../navigations/HomeNavigation';
import { useNavigation } from '@react-navigation/native';
const Home = () => {
  const [data_chat, setdata_chat] = useState([
    {
      id: 1,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 2,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 3,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 4,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 5,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 6,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 7,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 8,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 9,
      name: 'Alex Linderson',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
    {
      id: 10,
      name: 'Canhphan',
      content: 'How are you today?',
      time: '2 min ago',
      img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
    },
  ]);

  const longPressTimeout = useRef(null);

  const showDialogDelete = chatID => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa không?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        onPress: () => deleteChat(chatID),
        style: 'destructive',
      },
    ]);
  };

  const deleteChat = chatID => {
    setdata_chat(data_chat.filter(chat => chat.id !== chatID));
  };

=======
import {FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Item_Search from '../../Components/Item/Item_Search';
const Search = () => {
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
  return (
    <View style={styles.container}>
      <View style={styles.container_search}>
        <Icon name="search" size={24} color="#000E08" />
        <TextInput placeholder="Search" style={styles.input} />
      </View>
      <View style={styles.list_search}>
        <FlatList
          data={data}
          renderItem={({item}) => <Item_Search data={item} />}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
      <View style={styles.container_list_chat}>
        <FlatList
          data={data_chat}
          renderItem={({item}) => (
            <TouchableOpacity
              onLongPress={() => {
                longPressTimeout.current = setTimeout(() => {
                  showDialogDelete(item.id);
                });
              }}
              delayLongPress={1000}>
              <Item_home_chat data_chat={item} />
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
=======
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 17,
    flex: 1,
  },
  container_search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6F6',
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  input: {
    marginLeft: 10,
    fontWeight: '500',
    fontSize: 12,
  },
  list_search: {
    marginTop: 50,
  },
});

const data = [
  {
    id: 1,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 2,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 3,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 4,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 5,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 6,
<<<<<<< HEAD:src/Screens/Home_Search/Home.jsx
    name: 'Adil',
=======
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 7,
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 8,
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 9,
    name: 'Alex Linderson',
    content: 'How are you today?',
    time: '2 min ago',
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
  {
    id: 10,
    name: 'Canhphan',
    content: 'How are you today?',
    time: '2 min ago',
>>>>>>> origin/QThong_FB:scr/Screens/Search/Search.jsx
    img: 'https://s3-alpha-sig.figma.com/img/b1fb/7717/906c952085307b6af6e1051a901bdb02?Expires=1740355200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=nBkyYc18nxN1ZNDTOx0kCar-~PZ0P-mdH-hX3OjKhfGBeAqvBYCT24jSuKpW2FxFXg~ReLXQyLJOUVtWuGGVCqc3lVPzQcjy2RZqAaiOYqElERFPcugC7~M9KZOA34uJvrirarwBxUOV~u~ZXftITHv~zG93FfYSVSS2lEpiGGBPahee3SRlQ0H763oidcQr4Zmi-U7hutgMqouoH8kpkUfdbE9McjE0HlgpngFgWszMpaEdanATHouGUoHfG9RGztvXP9gefvvHnEDGw11rkKaJN7sX6qyVMTYqA4KI7pzi-PX3zZQretCvCEuZwmPUYPKdYzHlZnxR3ZGP4UOjZA__',
  },
];

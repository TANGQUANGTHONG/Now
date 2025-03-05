import {
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchMessage = ({navigation, chatId}) => {
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm tìm kiếm trực tiếp trong mảng tin nhắn
  const handleSearch = text => {
    setSearchText(text);
    if (text === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message =>
        message.content.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredMessages(filtered);
    }
  };

  // Load messages từ AsyncStorage khi chatId thay đổi
  useEffect(() => {
    const loadMessagesFromStorage = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        const messages = storedMessages ? JSON.parse(storedMessages) : [];
        setMessages(messages);
        setFilteredMessages(messages);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load messages from AsyncStorage', error);
        setLoading(false);
      }
    };

    loadMessagesFromStorage();
  }, [chatId]);
  return (
    <View style={{flex: 1}}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{margin: 20}}>
        <Icon name="arrow-left" size={28} color="black" />
      </TouchableOpacity>
      <View style={styles.container_search}>
        <Icon name="magnify" size={24} color="#000E08" />
        <TextInput
          placeholder="Search"
          style={styles.input}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.list_search}>
        {loading ? (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : filteredMessages.length > 0 ? (
          <FlatList
            data={filteredMessages}
            renderItem={({item}) => (
              <View style={styles.messageItem}>
                <Text>{item.content}</Text>
              </View>
            )}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noResults}>No results found</Text>
        )}
      </View>
    </View>
  );
};

export default SearchMessage;

const styles = StyleSheet.create({
  container_search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 5,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 5,
    height: 40,
  },
  list_search: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  messageItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});

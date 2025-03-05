import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
  } from 'react-native';
  import React, {useEffect, useState, useRef} from 'react';
  import {GoogleGenerativeAI} from '@google/generative-ai';
  import {launchImageLibrary} from 'react-native-image-picker';
  
  import {useNavigation} from '@react-navigation/native';
  import {IconButton} from 'react-native-paper';
  
  
  const API_GEMINI_KEY = 'AIzaSyDI3FtFcFDJ56pt4i7qsufmJdOklo6F1OQ'; // Thay bằng API Key hợp lệ
  
  const Gemini = () => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
   // 🛠 Gửi tin nhắn văn bản
    const sendMessage = async () => {
      if (!messageText.trim() && !selectedImage) return;
  
      setLoading(true);
      const newMessages = [];
  
      if (selectedImage) {
        newMessages.push({
          type: 'image',
          content: `data:image/jpeg;base64,${selectedImage}`,
          user: true,
        });
      }
  
      if (messageText.trim()) {
        newMessages.push({type: 'text', content: messageText, user: true});
      }
  
      setMessages(prev => [...prev, ...newMessages]);
      setSelectedImage(null);
      setMessageText('');
  
      try {
        const genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
        const model = genAI.getGenerativeModel({model: 'gemini-1.5-pro'});
  
        // Tạo lịch sử hội thoại đầy đủ để gửi
        const conversationHistory = messages.map(msg => ({
          role: msg.user ? 'user' : 'model',
          parts:
            msg.type === 'image'
              ? [
                  {
                    inlineData: {
                      data: msg.content.split(',')[1],
                      mimeType: 'image/jpeg',
                    },
                  },
                ]
              : [{text: msg.content}],
        }));
  
        // Thêm tin nhắn mới
        const parts = [];
        if (selectedImage) {
          parts.push({
            inlineData: {
              data: selectedImage,
              mimeType: 'image/jpeg',
            },
          });
        }
        if (messageText.trim()) {
          parts.push({text: messageText});
        }
        conversationHistory.push({role: 'user', parts});
  
        // Gửi tin nhắn đến Gemini AI
        const generatedContent = await model.generateContent({
          contents: conversationHistory, // Gửi toàn bộ lịch sử
        });
  
        const aiResponse = generatedContent.response.text();
  
        setMessages(prev => [
          ...prev,
          {type: 'text', content: aiResponse, user: false},
        ]);
        scrollToEnd();
      } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
      } finally {
        setLoading(false);
      }
    };
  
    // 📸 Chọn ảnh từ thư viện
    const pickImage = () => {
      launchImageLibrary({mediaType: 'photo', includeBase64: true}, response => {
        if (response.assets && response.assets.length > 0) {
          const base64 = response.assets[0].base64;
          setSelectedImage(base64); // Lưu ảnh nhưng chưa gửi ngay
        }
      });
    };
  
    const scrollToEnd = () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 300);
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <IconButton icon="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gemini AI Chat</Text>
        </View>
  
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <View
                style={[
                  styles.messageBubble,
                  item.user ? styles.userMessage : styles.aiMessage,
                ]}>
                {item.type === 'image' ? (
                  <Image source={{uri: item.content}} style={styles.chatImage} />
                ) : (
                  <Text style={styles.messageText}>{item.content}</Text>
                )}
              </View>
            )}
            contentContainerStyle={styles.chatContainer}
          />
  
          <View style={styles.inputContainer}>
            {selectedImage && (
              <Image
                source={{uri: `data:image/jpeg;base64,${selectedImage}`}}
                style={styles.previewImage}
              />
            )}
  
            <TextInput
              placeholder="Nhập tin nhắn..."
              onChangeText={setMessageText}
              value={messageText}
              onSubmitEditing={sendMessage}
              style={styles.input}
            />
            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
              <IconButton icon="image" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <IconButton icon="send" size={24} color="white" />
            </TouchableOpacity>
            {loading && <ActivityIndicator size="small" color="black" />}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };
  
  export default Gemini;
  
  const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f0f4f8'},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0084ff',
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    backButton: {marginRight: 10},
    headerTitle: {fontSize: 20, fontWeight: 'bold', color: 'white'},
    chatContainer: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: 15,
      paddingBottom: 10,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      marginVertical: 5,
      borderRadius: 15,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#0084ff',
      borderBottomRightRadius: 0,
    },
    aiMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#e0e0e0',
      borderBottomLeftRadius: 0,
    },
    messageText: {color: 'black', fontSize: 16},
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#fff',
    },
    input: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      backgroundColor: 'white',
    },
    chatImage: {width: 200, height: 200, borderRadius: 10, marginTop: 5},
    previewImage: {
      width: 100,
      height: 100,
      borderRadius: 10,
      margin: 10,
      alignSelf: 'flex-start',
    },
    audioButton: {
      backgroundColor: "#ff3b30",
      padding: 12,
      borderRadius: 50,
      marginLeft: 10,
    },
    
  });
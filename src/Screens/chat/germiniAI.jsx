import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_GEMINI_KEY = "AIzaSyDI3FtFcFDJ56pt4i7qsufmJdOklo6F1OQ"; // Thay bằng API Key hợp lệ

const Gemini = () => {
    const [messagesAI, setMessagesAI] = useState([]);
    const [messagesUser, setMessagesUser] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null); // Tạo `ref` để quản lý danh sách tin nhắn

    useEffect(() => {
        const StartChat = async () => {
            try {
                const genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
                const prompt = "Write a story about a magic backpack.";
                const result = await model.generateContent(prompt);
                const text = result.response.text();
    
                setMessagesAI([{ text, user: false }]);  // ❌ KHÔNG nên tự động khởi tạo tin nhắn từ AI
            } catch (error) {
                console.error("Error:", error);
            }
        };
        StartChat();
    }, []);
    

    const sendMessage = async () => {
        if (!messagesUser.trim()) return;
    
        setLoading(true);
        const newUserMessage = { text: messagesUser, user: true };
        setMessagesAI((prev) => [...prev, newUserMessage]);
        const currentMessage = messagesUser; // Lưu lại nội dung trước khi reset
        setMessagesUser("");
    
        try {
            const genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
            // Chỉ lấy lịch sử từ các tin nhắn của người dùng
            const history = messagesAI
                .filter((msg) => msg.user) // Chỉ lấy tin nhắn từ user
                .map((msg) => ({
                    role: "user",
                    parts: [{ text: msg.text }],
                }));
    
            // Thêm tin nhắn mới của người dùng vào lịch sử
            history.push({
                role: "user",
                parts: [{ text: currentMessage }],
            });
    
            // Bắt đầu cuộc hội thoại với lịch 
            const chat = model.startChat({
                history: history,
                generationConfig: { maxOutputTokens: 200 },
            });
    
            const result = await chat.sendMessage(currentMessage);
            const text = result.response.candidates[0].content.parts[0].text; // Lấy nội dung
    
            setMessagesAI((prev) => [...prev, { text, user: false }]);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 300);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    
    
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
                <FlatList
                    ref={flatListRef} // Gán `ref` vào FlatList
                    data={messagesAI}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.messageBubble, item.user ? styles.userMessage : styles.aiMessage]}>
                            <Text style={styles.messageText}>{item.text}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.chatContainer}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} // Tự động cuộn khi có tin nhắn mới
                />
                
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Nhập tin nhắn..."
                        onChangeText={setMessagesUser}
                        value={messagesUser}
                        onSubmitEditing={sendMessage}
                        style={styles.input}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Gửi</Text>
                    </TouchableOpacity>
                    {loading && <ActivityIndicator size="small" color="black" />}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Gemini;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    chatContainer: {
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
    },
    userMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#0084ff",
    },
    aiMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#e1e1e1",
    },
    messageText: {
        color: "black",
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",
    },
    input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: "#0084ff",
        padding: 10,
        borderRadius: 5,
    },
    sendButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    img: {
        width: 52,
        height: 52,
        borderRadius: 50,
      },
});

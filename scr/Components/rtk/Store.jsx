import { combineReducers, configureStore } from "@reduxjs/toolkit";
import songReducer from "./Reducer"; // Đường dẫn đến songSlice của bạn
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';

// Cấu hình persist
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
};

// Kết hợp các reducers
const rootReducer = combineReducers({
    songs: songReducer, // Sử dụng songReducer cho state bài hát
});

// Tạo persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Cấu hình Redux Store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

// Tạo persistor
export const persistor = persistStore(store);

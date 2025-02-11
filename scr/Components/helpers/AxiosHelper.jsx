import axios from 'react-native-axios';
import { store } from '../rtk/Store'; // Đảm bảo bạn đã xuất `store` từ Redux store

const AxiosHelper = (contentType = 'application/json') => {
    const axiosInstance = axios.create({
        baseURL: 'https://api-q69y.onrender.com',
    });

    axiosInstance.interceptors.request.use(
        (config) => {
            const state = store.getState();
            config.headers.Accept = 'application/json';
            config.headers['Content-Type'] = contentType;
            return config;
        },
        (err) => Promise.reject(err)
    );

    axiosInstance.interceptors.response.use(
        (res) => res.data,
        (err) => Promise.reject(err)
    );

    return axiosInstance;
};

export default AxiosHelper;

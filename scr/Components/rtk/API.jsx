import { createAsyncThunk } from '@reduxjs/toolkit'
import AxiosHelper from '../helpers/AxiosHelper'
import { setUser } from './Reducer';

export const login = createAsyncThunk(
    "user/login",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const response = await AxiosHelper().post("/user/login", data);
            if (response.message === 'Thành công') {
                const token = response.token;
                dispatch(setUser({ token })); // Lưu token vào Redux store
                return response;
            }
            return rejectWithValue('Đăng nhập thất bại');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const register = createAsyncThunk(
    "user/register",
    async (data, { rejectWithValue }) => {
        try {
            const response = await AxiosHelper()
                .post("/user/register", data);
            console.log(response);
            if (response.status == true) {
                return response.data;
            }
        } catch (error) {
            console.log(error);
            return rejectWithValue(error);
        }
    }
);

// Lấy tất cả bài hát
export const getAllSongs = createAsyncThunk(
    'songs/getAllSongs',
    async (_, { rejectWithValue }) => {
        try {
            const response = await AxiosHelper().get('/song/get_all_song');
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Lỗi khi tải danh sách bài hát.');
        }
    }
);

// Lấy bài hát theo thể loại
export const getSongsByGenre = createAsyncThunk(
    'songs/getSongsByGenre',
    async (genre, { rejectWithValue }) => {
        try {
            const response = await AxiosHelper().get(`/song/get_song_by_genre?Genre=${genre}`);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Lỗi khi tải bài hát theo thể loại.');
            }
        }
    );

// Lấy bài hát theo ID
// Lấy bài hát theo ID sử dụng Axios
export const getSongById = createAsyncThunk('songs/getSongById', async (songId, { rejectWithValue }) => {
    try {
        const response = await AxiosHelper().get(`/song/get_song_by_id/${songId}`);
        return response; // Trả về dữ liệu từ response
    } catch (error) {
        console.error('Error fetching song by ID:', error); // Log lỗi
        return rejectWithValue(error.message || 'Lỗi khi tải bài hát.');
    }
});




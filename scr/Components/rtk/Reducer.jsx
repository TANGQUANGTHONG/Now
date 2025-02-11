import { createSlice } from '@reduxjs/toolkit';
import { login, register, getAllSongs, getSongsByGenre, getSongById } from './API';

const initialState = {
    songs: [],
    genreSongs: [],
    song: null,
    songId: null,
    loading: false,
    error: null,
};

const songSlice = createSlice({
    name: 'songs',
    initialState,
    reducers: {
        // Lưu ID của bài hát hiện tại
        setSongId(state, action) {
            state.songId = action.payload;
        },
        // Lưu thông tin bài hát hiện tại
        setSong(state, action) {
            state.song = action.payload;
        },
        // Xóa thông tin bài hát hiện tại
        clearSong(state) {
            state.song = null;
            state.songId = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Xử lý getAllSongs
            .addCase(getAllSongs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSongs.fulfilled, (state, action) => {
                state.loading = false;
                state.songs = action.payload; // Lưu danh sách bài hát
            })
            .addCase(getAllSongs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message; // Lưu thông báo lỗi
            })
            // Xử lý getSongById
            .addCase(getSongById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSongById.fulfilled, (state, action) => {
                state.loading = false;
                state.song = action.payload; // Lưu dữ liệu bài hát
                console.log('Song data stored in Redux:', action.payload);
            })
            .addCase(getSongById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                console.log('Error fetching song:', action.error.message);
            })
            // Xử lý getSongsByGenre
            .addCase(getSongsByGenre.fulfilled, (state, action) => {
                state.genreSongs = action.payload; // Lưu danh sách bài hát theo thể loại
            })
            .addCase(getSongsByGenre.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

// Xuất action để có thể sử dụng khi cần thiết
export const { setSongId, setSong, clearSong } = songSlice.actions;

// Xuất reducer mặc định để tích hợp với store
export default songSlice.reducer;

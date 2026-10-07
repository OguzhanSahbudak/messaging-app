import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================

// Geliştirme 1: localStorage verilerini güvenli okuma fonksiyonu.
// Veri bozuksa veya "undefined" ise JSON.parse uygulamayı patlatmasın diye try-catch kullanıyoruz.
const getSafeLocalStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

export const updateChannel = createAsyncThunk(
    'chat/updateChannel',
    async ({ channelId, name, description }, { rejectWithValue }) => {
        try {
            const response = await api.put(`channels/${channelId}`, {
                name,
                description
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Kanal güncellenirken hata oluştu');
        }
    }
);
// === YENİ EKLENEN THUNK'LAR ===

// 1. DMs sekmesindeki geçmiş sohbet odalarını çekme (GET /api/v1/channels/dms) DMs sekmesindeki geçmiş sohbet odalarını çekme
export const fetchMyDms = createAsyncThunk(
    'chat/fetchMyDms',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('channels/dms');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'DM listesi çekilemedi');
        }
    }
);

// 2. Home sekmesinde bir kullanıcıya tıklayınca DM kanalı açma/getirme (POST /api/v1/channels/dm)
export const startOrGetDM = createAsyncThunk(
    'chat/startOrGetDM',
    async (targetUserId, { rejectWithValue }) => {
        try {
            const response = await api.post('channels/dm', { target_user_id: targetUserId });
            // Backend yanıtı doğrudan ID string'i veya kanal objesi olabilir
            const channelData = typeof response.data === 'string' ? { id: response.data } : response.data;
            return channelData;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'DM kanalı oluşturulamadı');
        }
    }
);

// 3. Kanalın veya DM odasının geçmiş mesajlarını çekme (GET /api/v1/channels/{channel_id}/messages)
export const fetchChannelMessages = createAsyncThunk(
    'chat/fetchChannelMessages',
    async ({ channelId, limit = 50, offset = 0 }, { rejectWithValue }) => {
        try {
            const response = await api.get(`channels/${channelId}/messages`, {
                params: { limit, offset }
            });
            return { data: response.data, offset }
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Mesaj geçmişi alınamadı');
        }
    }
);





const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        activeTab: 'home',
        activeUser: getSafeLocalStorage('activeUser'),
        activeChannel: getSafeLocalStorage('activeChannel'),
        messages: [],
        dmList: [],
        loadingDms: false, // === EKLENDİ ===
        loadingMessages: false, // === EKLENDİ ===
        loading: false,
        error: null,
    },
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setActiveUser: (state, action) => {
            state.activeUser = action.payload;
            // DÜZELTME: Kanalı SİLMİYORUZ, ikisi aynı anda yaşayabilir
            localStorage.setItem('activeUser', JSON.stringify(action.payload));
        },
        setActiveChannel: (state, action) => {
            state.activeChannel = action.payload;

            // DÜZELTME: Kullanıcıyı SİLMİYORUZ
            localStorage.setItem('activeChannel', JSON.stringify(action.payload));
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            const newMessage = action.payload;

            // Gelen mesajın ait olduğu kanal ID'sini yakala
            const messageChannelId = newMessage.channel_id || newMessage.room_id;
            const activeChannelId = state.activeChannel?.id;

            // 1. KRİTİK KONTROL: Başka odaya ait mesajsa ekleme
            if (messageChannelId && activeChannelId && String(messageChannelId) !== String(activeChannelId)) {
                return;
            }

            // 2. KRİTİK KONTROL: Aynı ID'ye sahip mesaj listede zaten varsa ekleme (Çift gönderim önleyici)
            if (newMessage.id) {
                const exists = state.messages.some(msg => String(msg.id) === String(newMessage.id));
                if (exists) {
                    return;
                }
            }

            // Sadece yeni gelen mesajı listeye ekle (shift() kaldırıldı, böylece geçmiş mesajlar silinmez)
            state.messages.push(newMessage);
        },
        // === YENİ EKLENEN REDUCER: Gelen mesajın ait olduğu sohbeti sol listede en üste taşır ===
        moveChannelToTop: (state, action) => {
            const channelId = action.payload;
            if (!channelId) return;
            // dmList dizisinde ilgili kanalı arıyoruz
            const index = state.dmList.findIndex(ch => String(ch.id) === String(channelId));
            if (index != -1) {
                // Kanalı mevcut yerinden söküp alıyoruz
                const [channel] = state.dmList.splice(index, 1);
                // Dizinin EN BAŞINA ekliyoruz
                state.dmList.unshift(channel);
            }

        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateChannel.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateChannel.fulfilled, (state, action) => {
                state.loading = false;
                if (state.activeChannel && state.activeChannel.id === action.payload.id) {
                    state.activeChannel = { ...state.activeChannel, ...action.payload };
                    // Güncellenmiş kanalı localStorage'a da yansıtıyoruz
                    localStorage.setItem('activeChannel', JSON.stringify(state.activeChannel));
                }
            })
            .addCase(updateChannel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // === YENİ EKLENEN EXTRA REDUCERS ===
            // DMs Listesi
            .addCase(fetchMyDms.pending, (state) => {
                state.loadingDms = true;
            })
            .addCase(fetchMyDms.fulfilled, (state, action) => {
                state.loadingDms = false;
                state.dmList = action.payload;
            })
            .addCase(fetchMyDms.rejected, (state) => {
                state.loadingDms = false;
            })

            // --- START OR GET DM (Geliştirme 2) ---
            // DM başlatıldığında dönen kanal verisini Redux state'ine ve localStorage'a kaydediyoruz.
            .addCase(startOrGetDM.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(startOrGetDM.fulfilled, (state, action) => {
                state.loading = false;
                state.activeChannel = action.payload;
                localStorage.setItem('activeChannel', JSON.stringify(action.payload));
            })
            .addCase(startOrGetDM.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Geçmiş Mesajlar
            .addCase(fetchChannelMessages.pending, (state) => {
                state.loadingMessages = true;
            })
            .addCase(fetchChannelMessages.fulfilled, (state, action) => {
                state.loadingMessages = false;

                const responseData = action.payload.data;

                // Backend'den gelen veri formatını esnek şekilde yakalıyoruz
                let fetchedMessages = [];
                if (Array.isArray(responseData)) {
                    fetchedMessages = responseData; // Direkt dizi geldiyse [ ... ]
                } else if (responseData && Array.isArray(responseData.messages)) {
                    fetchedMessages = responseData.messages; // { messages: [ ... ] } geldiyse
                } else if (responseData && Array.isArray(responseData.data)) {
                    fetchedMessages = responseData.data; // { data: [ ... ] } geldiyse
                }

                console.log("📥 Redux'a Yazılan Geçmiş Mesajlar:", fetchedMessages);

                if (action.payload.offset === 0) {
                    state.messages = fetchedMessages;
                } else {
                    state.messages = [...fetchedMessages, ...state.messages];
                }
            })

    }
});

export const { setActiveUser, setActiveChannel, setMessages, addMessage, setActiveTab, moveChannelToTop } = chatSlice.actions;
export default chatSlice.reducer;
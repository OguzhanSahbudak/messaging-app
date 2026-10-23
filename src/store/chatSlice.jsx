import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';
import { setInitialUnreadCounts } from './notificationSlice';

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
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.get('channels/dms');
            // === KUSURSUZ ENTEGRASYON: Backend'den veri geldiği an sayıları Redux'a doldur ===
            if (Array.isArray(response.data)) {
                 dispatch(setInitialUnreadCounts(response.data));
            }
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

// mesajlarda Arama yapma
export const searchChannelMessages = createAsyncThunk(
    'chat/searchChannelMessages',
    async ({ channelId, query }, { rejectWithValue }) => {
        try {
            const response = await api.get(`channels/${channelId}/messages/search`, {
                params: { q: query }
            });
            return response.data; // gelen arama sonuçları

        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Arama yapılırken hata oluştu')
        }
    }
)

// mesaj silme thunkı
export const deleteChannelMessage = createAsyncThunk(
    'chat/deleteChannelMessage',
    async ({ channelId, messageId }, { rejectWithValue }) => {
        try {
            await api.delete(`channels/${channelId}/messages/${messageId}`);
            return messageId; // Silinen mesajın ID'sini dönüyoruz ki state'ten silebilelim
        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Mesaj silinemedi')
        }
    }
)

//mesaj güncelleme thunkı
export const updateChannelMessage = createAsyncThunk(
    'chat/updateChannelMessage',
    async ({ channelId, messageId, content }, { rejectWithValue }) => {
        try {
            const response = await api.put(`channels/${channelId}/messages/${messageId}`, {
                content: content
            });

            return { messageId, updatedContent: content, data: response.data };

        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Mesaj güncellenmedi');
        }
    }
)

//ortak kanalı çekme
export const fetchChannels = createAsyncThunk(
    'chat/fetchChannels',
    async (_, { dispatch , rejectWithValue }) => {
        try {
            const response = await api.get('channels');
            // Backend'den dönen esnek yapıyı (senin yazdığın gibi) diziye çevirip yakalıyoruz
            let channelList = [];
            if (Array.isArray(response.data)) {
                channelList = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                channelList = response.data.data;
            } else if (response.data && Array.isArray(response.data.channels)) {
                channelList = response.data.channels;
            }

            // === VERİYİ YAKALADIK VE ROZETLERİ DOLDURDUK ===
            dispatch(setInitialUnreadCounts(channelList));
            
            return response.data;
        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'kanallar çekilmedi')
        }
    }
)


    //DM sohbetini kalıcı olarak silme
    export const deleteDMConversation=createAsyncThunk(
        'chat/deleteDMConversation',
        async (channelId , {rejectWithValue})=>{
            try{
                await api.delete(`channels/dms/${channelId}`);
                return channelId; // İşlem başarılıysa silinen kanalın ID'sini reducer'a gönderiyoruz
            }
            catch(error)
            {
                return rejectWithValue(error.response?.data || 'DM sohbeti silinmedi');
            }
        }
    )


    export const markChannelAsRead=createAsyncThunk(
        'chat/markChannelAsRead',
        async (channelId , {rejectWithValue})=>{
            try{
                await api.post(`channels/${channelId}/read`);
                return channelId;
            }
            catch(error)
            {
                return rejectWithValue(error.response?.data || 'Okundu bilgisi gönderilmedi')
            }
        }
    )



const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        activeTab: 'home',
        activeUser: getSafeLocalStorage('activeUser'),
        activeChannel: getSafeLocalStorage('activeChannel'),
        searchResults: [],
        messages: [],
        dmList: [],
        channels: [],
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
            if (action.payload) {
                localStorage.setItem('activeUser', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('activeUser'); // Eğer null gelirse hafızadan tamamen siliyoruz
            }
        },
        setActiveChannel: (state, action) => {
            state.activeChannel = action.payload;
            state.searchResults = []; // Kanal değiştiğinde arama sonuçlarını sıfırla
            // DÜZELTME: Kullanıcıyı SİLMİYORUZ
            localStorage.setItem('activeChannel', JSON.stringify(action.payload));
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
        },
        addMessage: (state, action) => {
            const newMessage = action.payload;

            // Gelen mesajın ait olduğu kanal ID'sini yakala
            const messageChannelId = newMessage.channel_id || newMessage.room_id;
            const activeChannelId = state.activeChannel?.id;

            // 1. Başka odaya ait mesajsa ekleme
            if (messageChannelId && activeChannelId && String(messageChannelId) !== String(activeChannelId)) {
                return;
            }

            const messageId = newMessage.id || newMessage.message_id;
            const newContent = newMessage.content || newMessage.message;

            if (!messageId) return;

            // 2. Bu ID'li mesaj listede var mı? Index'ini buluyoruz
            const existingIndex = state.messages.findIndex(msg => String(msg.id) === String(messageId));

            if (existingIndex !== -1) {
                // EĞER VARSA: Doğrudan index üzerinden güncelliyoruz (Immer bunu anında yakalar!)
                if (newContent !== undefined) {
                    state.messages[existingIndex].content = newContent;
                    state.messages[existingIndex].message = newContent;
                    state.messages[existingIndex].is_edited = true;
                }
            } else {
                // 3. Listede hiç yoksa yepyepyeni mesajdır, alta ekle
                state.messages.push(newMessage);
            }

            // Arama sonuçlarında (searchResults) varsa orada da direkt güncelleyelim
            const searchIndex = state.searchResults.findIndex(msg => String(msg.id) === String(messageId));
            if (searchIndex !== -1 && newContent !== undefined) {
                state.searchResults[searchIndex].content = newContent;
                state.searchResults[searchIndex].message = newContent;
                state.searchResults[searchIndex].is_edited = true;
            }
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

        },
        // === 1. GERÇEK ZAMANLI MESAJ GÜNCELLEME REDUCER'I ===
        realtimeMessageUpdated: (state, action) => {
            const payload = action.payload?.data || action.payload?.message || action.payload;

            const updatedId = payload.message_id || payload.id;
            // DİKKAT: Backend'den gelen 'new_content' alanını da buraya ekledik!
            const newContent = payload.new_content || payload.content || payload.message || payload.updated_content;

            if (!updatedId || newContent === undefined) return;

            // 1. Ana messages dizisini .map ile güncelleyerek taze bir referans üretiyoruz
            state.messages = state.messages.map(m => {
                if (String(m.id) === String(updatedId)) {
                    return {
                        ...m,
                        content: newContent,
                        message: newContent,
                        is_edited: true
                    };
                }
                return m;
            });

            // 2. Arama sonuçları varsa orada da aynısını yapıyoruz
            state.searchResults = state.searchResults.map(m => {
                if (String(m.id) === String(updatedId)) {
                    return {
                        ...m,
                        content: newContent,
                        message: newContent,
                        is_edited: true
                    };
                }
                return m;
            });
        },
        // === 2. GERÇEK ZAMANLI MESAJ SİLME REDUCER'I ===
        realtimeMessageDeleted: (state, action) => {
            // Backend'den message_id veya id olarak gelebilir, ikisini de kontrol ediyoruz
            const deletedId = action.payload.message_id || action.payload.id;

            state.messages = state.messages.filter(m => String(m.id) !== String(deletedId));
            state.searchResults = state.searchResults.filter(m => String(m.id) !== String(deletedId));
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

            //arama addcase
            .addCase(searchChannelMessages.fulfilled, (state, action) => {
                let searchResult = [];
                const resData = action.payload;
                if (Array.isArray(resData)) {
                    searchResult = resData;
                }
                else if (resData && Array.isArray(resData.messages)) {
                    searchResult = resData.messages;
                }
                else if (resData && Array.isArray(resData.data)) {
                    searchResult = resData.data;
                }
                state.searchResults = searchResult; //bulunan mesajları ekrana basma
            })

            //mesaj silme
            .addCase(deleteChannelMessage.fulfilled, (state, action) => {
                const deleteId = action.payload;
                // Hem ana mesaj listesinden hem de arama sonuçlarından silinen mesajı çıkarıyoruz
                state.messages = state.messages.filter(msg => String(msg.id) !== String(deleteId));
                state.searchResults = state.searchResults.filter(msg => String(msg.id) !== String(deleteId));
            })

            //mesaj güncelleme
            .addCase(updateChannelMessage.fulfilled, (state, action) => {
                const { messageId, updatedContent } = action.payload;

                // 1. Ana messages dizisinde mesajı bul ve içeriğini güncelle
                const msgIndex = state.messages.findIndex(m => String(m.id) === String(messageId));
                if (msgIndex !== -1) {
                    state.messages[msgIndex].content = updatedContent;
                    state.messages[msgIndex].message = updatedContent; // Yedek alan desteği
                }

                // 2. Arama sonuçları (searchResults) içinde varsa orada da güncelle
                const searchIndex = state.searchResults.findIndex(m => String(m.id) === String(messageId));
                if (searchIndex !== -1) {
                    state.searchResults[searchIndex].content = updatedContent;
                    state.searchResults[searchIndex].message = updatedContent;
                }
            })

            //ortak kanalları listeye kaydetme
            .addCase(fetchChannels.fulfilled, (state, action) => {
                let channelRes = action.payload;
                if (Array.isArray(channelRes)) {
                    state.channels = channelRes;
                }
                else if (channelRes && Array.isArray(channelRes.data)) {
                    state.channels = channelRes.data;
                } else if (channelRes && Array.isArray(channelRes.channels)) {
                    state.channels = channelRes.channels;
                }
            })

            // === DM SİLME İŞLEMİ REDUCER'I ===
            .addCase(deleteDMConversation.fulfilled , (state , action)=>{
                const deletedChannelId=action.payload;
                state.dmList=state.dmList.filter(dm => String(dm.id) !== String(deletedChannelId));

                if(state.activeChannel && String(state.activeChannel.id) === String(deletedChannelId))
                {
                    state.activeChannel = null;
                    state.activeUser = null;
                    state.messages = [];
                    localStorage.removeItem('activeChannel');
                    localStorage.removeItem('activeUser');
                }
            })

            .addCase(markChannelAsRead.fulfilled , (state , action)=>{
                const readChannelId=action.payload;


                // 1. Kanal listesinde o kanalı bulup sayacı anında 0 yapıyoruz
                const channel = state.channels.find(c => c.id === readChannelId);
                if (channel) {
                    channel.unread_message_count = 0; 
                }

                // 2. Eğer aktif kanalın kendi içinde de bir sayaç tutuluyorsa onu da sıfırlıyoruz
                if (state.activeChannel && state.activeChannel.id === readChannelId) {
                    state.activeChannel.unread_message_count = 0;
                }
            })


    }
});

export const { setActiveUser, setActiveChannel, setMessages, addMessage, setActiveTab, moveChannelToTop, clearSearchResults, realtimeMessageDeleted, realtimeMessageUpdated } = chatSlice.actions;
export default chatSlice.reducer;
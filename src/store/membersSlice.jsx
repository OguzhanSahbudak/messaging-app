import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

//THUNK: Üyeleri getirme
export const fetchChannelMembers = createAsyncThunk('members/fetchChannelMembers',
    async (args, { rejectWithValue }) => {
        try {
            // Parametre obje olarak da gelebilir, direkt ID string'i olarak da (hata vermesin diye koruma)
            const channelId = typeof args === 'object' ? args.channelId : args;
            const searchQuery = typeof args === 'object' && args.searchQuery ? args.searchQuery : '';

            const response = await api.get(`channels/${channelId}/members`, {
                params: { search: searchQuery }
            })

            // Gelen veriyi ve "bu bir arama işlemi miydi?" bilgisini dönüyoruz
            return { data: response.data, isSearch: searchQuery.trim() !== '' };
        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Üyeler yüklenemedi');
        }
    })

// YENİ THUNK: Üye ad/soyad güncelleme
export const updateChannelMember = createAsyncThunk(
    'members/updateChannelMember',
    async ({ channelId, targetUserId, firstName, lastName }, { rejectWithValue }) => {
        try {
            // API dokümanına göre PUT isteği
            const response = await api.put(`channels/${channelId}/members/${targetUserId}`, {
                first_name: firstName,
                last_name: lastName
            });
            // Başarılı (200) olursa, UI'ı güncellemek için verileri geri dönüyoruz[cite: 3]
            return { targetUserId, firstName, lastName };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Üye güncellenemedi');
        }
    }
);

    //Kullanıcıyı Kanaldan Çıkarma
    export const removeChannelMember=createAsyncThunk(
        'members/removeChannelMember',
        async({channelId , targetUserId},{rejectWithValue})=>{
            try
            {
                await api.delete(`channels/${channelId}/members/${targetUserId}`);
                return targetUserId;
            }
            catch(error)
            {
                return rejectWithValue(error.response?.data || 'Kullanıcı kanaldan çıkarılamadı');
            }
        }
    )

const memberSlice = createSlice({
    name: 'members',
    initialState: {
        list: [], // Ana Liste: Mesaj ekranı (MessageList) buraya bakacak ve hiç ezilmeyecek
        searchList: [], // Arama Listesi: Sol menü (WorkspaceSidebar) buraya bakacak
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchChannelMembers.pending, (state) => {
            state.loading = true,
                state.error = null;
        })
            .addCase(fetchChannelMembers.fulfilled, (state, action) => {
                state.loading = false;
                // 🔍 KRİTİK AYRIM MANTIĞI:
                if (action.payload.isSearch) {
                    // Eğer arama kutusuna bir şey yazıldıysa SADECE searchList'i ez, ana listeye dokunma!
                    state.searchList = action.payload.data;
                } else {
                    // Sayfa ilk açıldığında (arama yokken) her iki listeyi de doldur
                    state.list = action.payload.data;
                    state.searchList = action.payload.data;
                }
            })
            .addCase(fetchChannelMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateChannelMember.fulfilled, (state, action) => {
                const { targetUserId, firstName, lastName } = action.payload;
                [state.list, state.searchList].forEach(targetList => {
                    const member = targetList.find((m) => String(m.user_id || m.id || m.user?.id) === String(targetUserId));
                    if (member) {
                        member.first_name = firstName;
                        member.last_name = lastName;
                        // Eğer nested user objesi varsa onun da adını güncelle
                        if (member.user) {
                            member.user.first_name = firstName;
                            member.user.last_name = lastName;
                        }
                    }
                })

            })
            //kullanıcı silme reducer'ı
            .addCase(removeChannelMember.fulfilled , (state , action)=>{
                    const removedUserId=action.payload;

                    // Silinen kişiyi hem ana listeden hem de arama listesinden filtreleyerek çıkarıyoruz
                state.list = state.list.filter(m => String(m.user_id || m.id || m.user?.id) !== String(removedUserId));
                state.searchList = state.searchList.filter(m => String(m.user_id || m.id || m.user?.id) !== String(removedUserId));
            })

    }
})

export default memberSlice.reducer
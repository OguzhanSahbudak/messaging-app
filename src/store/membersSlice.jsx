import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

//THUNK: Üyeleri getirme
export const fetchChannelMembers=createAsyncThunk('members/fetchChannelMembers',
    async(channelId , {rejectWithValue})=>{
        try{
            const response =await api.get(`channels/${channelId}/members`)
            return response.data;
        }
        catch(error){
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

    const memberSlice =createSlice({
        name:'members',
        initialState:{
            list:[],
            loading:false,
            error:null,
        },
        reducers:{},
        extraReducers:(builder)=>{
            builder.addCase(fetchChannelMembers.pending , (state)=>{
                state.loading=true,
                state.error=null;
            })
            .addCase(fetchChannelMembers.fulfilled , (state , action)=>{
                state.loading=false,
                state.list=action.payload;
            })
            .addCase(fetchChannelMembers.rejected , (state , action)=>{
                state.loading=false;
                state.error=action.payload;
            })
            .addCase(updateChannelMember.fulfilled , (state , action)=>{
                const {targetUserId , firstName , lastName}=action.payload;
                const member=state.list.find((m)=>m.user_id===targetUserId);
                if(member)
                {
                    member.first_name=firstName;
                    member.last_name=lastName;
                }
            })
        }
    })

    export default memberSlice.reducer
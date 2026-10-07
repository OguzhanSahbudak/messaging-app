import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

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
        }
    })

    export default memberSlice.reducer
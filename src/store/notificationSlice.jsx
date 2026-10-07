import {createSlice} from '@reduxjs/toolkit';


const initialState={
    unreadCounts: {}, // Hangi kişiden kaç okunmamış mesaj var? Örn: { '123': 2 },
    appNotification: {
        open: false,
        senderName: '',
        message: '',
        severity: 'info' // İleride hata (error) veya başarı (success) bildirimleri için de kullanabilirsin
    }
}

const notificationSlice=createSlice({
    name:'notification',
    initialState,
    reducers:{
        // 1. Okunmamış mesaj sayısını artır
        incrementUnreadCount:(state , action) =>{
            const senderId=action.payload;
            // Eğer o id'de değer varsa 1 artır, yoksa 1 olarak başlat
            state.unreadCounts[senderId]=(state.unreadCounts[senderId] || 0)+1;
        },
        // 2. Mesaja tıklandığında okunmamış sayısını sıfırla
        clearUnreadCount:(state , action) =>{
            const channelId=action.payload;
            state.unreadCounts[channelId]=0;
        },
        // 3. Sağ alt (MUI Snackbar) bildirimini aç
        showNotification:(state , action)=>{
            state.appNotification={
                open:true,
                senderName:action.payload.senderName,
                message:action.payload.message,
                severity:action.payload.severity || 'info'
            }
        },
        // 4. Bildirimi kapat
        hideNotification:(state) =>{
            state.appNotification.open=false;
        }
    }
})

export const { incrementUnreadCount, clearUnreadCount, showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
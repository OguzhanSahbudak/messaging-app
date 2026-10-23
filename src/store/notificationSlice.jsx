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
        // === YENİ EKLENEN REDUCER: Sayfa açıldığında backend'den gelen sayıları kaydeder ===
        setInitialUnreadCounts: (state, action) => {
            const channelsList = action.payload; // Backend'den gelen kanal/DM listesi (Array)

            console.log("🔥 X-RAY 1 (Redux'a Gelen Veri):", channelsList);
            
            channelsList.forEach(channel => {
                if (channel.unread_message_count > 0) {
                    state.unreadCounts[channel.id] = channel.unread_message_count;
                }
            });
        },
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

export const { incrementUnreadCount, clearUnreadCount, showNotification, hideNotification ,setInitialUnreadCounts } = notificationSlice.actions;
export default notificationSlice.reducer;
import React, { useCallback, useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, fetchChannelMessages, moveChannelToTop } from '../../../../store/chatSlice';
import { useChatWebSocket } from '../../../../hooks/useChatWebSocket';
import api from '../../../../api/axiosInstance'

// JWT Token'dan kullanıcı ID'sini çözen yardımcı fonksiyon
const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id || payload.id;
    } catch (e) {
        return null;
    }
};

const ChatArea = ({ toggleMobileSidebar }) => {
    const dispatch = useDispatch();
    const { activeUser, activeChannel } = useSelector((state) => state.chat);

    // Aktif kanal değiştiğinde geçmiş mesajları çek
    useEffect(() => {
        if (activeChannel?.id) {
            dispatch(fetchChannelMessages({ channelId: activeChannel.id, offset: 0, limit: 50 }));
        }
    }, [dispatch, activeChannel?.id]);

    // WebSocket URL (Sadece o anki odaya ait mesajlaşma kanalı)
    const wsUrl = useMemo(() => {
        if (!activeChannel?.id) { return null; }
        const token = localStorage.getItem('token');
        if (!token) return null;
        const wsProtocol = api.defaults.baseURL.startsWith('https') ? 'wss:' : 'ws:';
        const wsHost = new URL(api.defaults.baseURL).host;
        return `${wsProtocol}//${wsHost}/api/v1/ws/${activeChannel.id}?token=${token}`;
    }, [activeChannel?.id]);

    // WebSocket mesaj dinleyicisi (SADECE MESAJI EKRANA BASAR)
    const handleReceiveMessage = useCallback((data) => {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log("📥 Odanın İçine Düşen Mesaj Verisi:", parsedData);

        if (parsedData.type === 'chat_message' || parsedData.type === 'new_message' || parsedData.content) {
            // Gelen mesajı sohbet akışına ekle
            dispatch(addMessage(parsedData));
        }
    }, [dispatch]);

    const { sendMessage } = useChatWebSocket(wsUrl, handleReceiveMessage);

    const handleSendMessage = (payload) => {
        const socketPayload = {
            type: "chat_message",
            ...payload
        };
        sendMessage(socketPayload);
        // === 2. ADIM: Mesaj gönderildiği an aktif sohbeti sol listede EN ÜSTE taşıyoruz ===
        if (activeChannel?.id) {
            dispatch(moveChannelToTop(activeChannel.id))
        }
    };

    // --- DEĞİŞİKLİK 2: DOSYA GÖNDERME FONKSİYONU ---
    // NEDEN: Swagger doc'a göre dosyalar "/channels/{id}/messages/with-file" endpoint'ine POST ediliyor.
    // FormData kullanarak hem dosyayı hem de varsa metni backend'e yollayan fonksiyonu oluşturduk.
    const handleSendFileMessage = async (file, textContent) => {
        if (!activeChannel?.id) { return; }
        // FormData, JavaScript'te dosya göndermenin standart ve en güvenli yoludur.
        const formData = new FormData();
        formData.append('file', file);// Swagger'daki zorunlu 'file' parametresi
        if (textContent) {
            formData.append('content', textContent);// Swagger'daki opsiyonel 'content' parametresi
        }
        try {
            // api.js'de base_url ayarlı olduğu için doğrudan endpoint'i yazıyoruz.
            // Token eklememize gerek yok çünkü senin api.js dosyasındaki interceptor bunu otomatik ekliyor.
            const response = await api.post(`channels/${activeChannel.id}/messages/with-file`, formData);


            const newFileMessage = response.data;
            dispatch(addMessage(newFileMessage));

            dispatch(moveChannelToTop(activeChannel.id));
        }
        catch (error) {
            console.error("Dosya yüklenirken hata oluştu:", error);
        }
    }


    if (!activeUser && !activeChannel) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <h3 style={{ color: 'var(--text-muted)' }}>Sohbete başlamak için sol menüden birini seçin</h3>
            </div>
        );
    }

    return (
        <div className="chat-main-area">
            <ChatHeader onMenuClick={toggleMobileSidebar} />
            <MessageList />
            <MessageInput activeUser={activeUser} activeChannel={activeChannel} sendMessage={handleSendMessage} sendFileMessage={handleSendFileMessage} />
        </div>
    );
};

export default ChatArea;
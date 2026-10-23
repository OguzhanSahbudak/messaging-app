import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, fetchChannelMessages, markChannelAsRead, moveChannelToTop, realtimeMessageDeleted, realtimeMessageUpdated } from '../../../../store/chatSlice';
import { useChatWebSocket } from '../../../../hooks/useChatWebSocket';
import api from '../../../../api/axiosInstance'
import { clearUnreadCount } from '../../../../store/notificationSlice';



const ChatArea = ({ toggleMobileSidebar }) => {
    const dispatch = useDispatch();
    const { activeUser, activeChannel } = useSelector((state) => state.chat);

    // --- YENİ: Arama metni state'ini ortak ebeveyn olan ChatArea'da tutuyoruz ---
    const [searchQuery, setSearchQuery] = useState('');

    const prevChannelIdRef = useRef(activeChannel?.id);

    const isFirstMount=useRef(true);

    // Aktif kanal değiştiğinde geçmiş mesajları çek
    useEffect(() => {
        if (activeChannel?.id) {
            setSearchQuery('');
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

    // WebSocket mesaj dinleyicisi (SADECE MESAJI EKRANA BASAR VE GÜNCELLEME/SİLME YAKALAR)
    const handleReceiveMessage = useCallback((data) => {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log("📥 Odanın İçine Düşen Mesaj Verisi:", parsedData);

        // === 1. ADIM: Oda içindeki socket verilerini türüne göre Redux'a aktarıyoruz ===
        switch (parsedData.type) {
            case 'chat_message':
            case 'new_message':
                if (parsedData.content || parsedData.message) {
                    dispatch(addMessage(parsedData));

                    dispatch(clearUnreadCount(activeChannel.id))
                }
                break;

            // Oda içinde mesaj silindiğinde tetiklenecek event'ler
            case 'message_deleted':
            case 'message_delete':
            case 'delete_message':
                console.log("🗑️ Oda İçinden Mesaj Silindi:", parsedData);
                dispatch(realtimeMessageDeleted(parsedData));
                break;

            // Oda içinde mesaj güncellendiğinde/düzenlendiğinde tetiklenecek event'ler

            case 'message_edited':
                console.log("✏️ Oda İçinde Mesaj Güncellendi:", parsedData);
                dispatch(realtimeMessageUpdated(parsedData));
                break;

            default:
                if (parsedData.content) {
                    dispatch(addMessage(parsedData));
                }
                break;
        }
    }, [dispatch, activeChannel?.id]);

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
            <ChatHeader onMenuClick={toggleMobileSidebar} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <MessageList searchQuery={searchQuery} />
            <MessageInput activeUser={activeUser} activeChannel={activeChannel} sendMessage={handleSendMessage} sendFileMessage={handleSendFileMessage} />
        </div>
    );
};

export default ChatArea;
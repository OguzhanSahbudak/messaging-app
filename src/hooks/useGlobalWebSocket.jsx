import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { incrementUnreadCount, showNotification } from '../store/notificationSlice';
import { moveChannelToTop } from '../store/chatSlice';
import api from '../api/axiosInstance'
// Ses dosyasını hafızaya alıyoruz (Preload)
const notificationAudio = new Audio('/notification.mp3');
notificationAudio.preload = 'auto';

export const useGlobalWebSocket = () => {
    const dispatch = useDispatch();
    const ws = useRef(null);

    const activeChannel = useSelector((state) => state.chat.activeChannel);

    // activeChannel'ı ref içinde tutuyoruz ki soket bağlantısı kopmasın
    const activeChannelRef = useRef(activeChannel);

    useEffect(() => {
        activeChannelRef.current = activeChannel;
    }, [activeChannel]);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn('Token bulunamadı, WebSocket bağlantısı kurulamadı.');
            return;
        }

        const wsProtocol = api.defaults.baseURL.startsWith('https') ? 'wss:' : 'ws:';
        const wsHost = new URL(api.defaults.baseURL).host;
        const wsUrl = `${wsProtocol}//${wsHost}/api/v1/ws/global?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('🟢 Global WebSocket Bağlantısı Başarıyla Kuruldu!');
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Global WebSocketten gelen veri:', data);

            switch (data.type) {
                case 'call_request':
                    console.log('Gelen Arama İsteği:', data);
                    // dispatch(setIncomingCall(data));
                    break;

                case 'new_message':
                case 'chat_message':
                case 'notification': {
                    const currentChannelId = activeChannelRef.current?.id;
                    const isDifferentChannel = !data.channel_id || String(data.channel_id) !== String(currentChannelId);

                    // Sekme arka planda mı / simge durumunda mı kontrolü
                    const isTabHidden = document.visibilityState === 'hidden' || !document.hasFocus();

                    console.log("🔔 Bildirim Kontrolü:", {
                        isDifferentChannel,
                        currentChannelId,
                        gelenChannelId: data.channel_id,
                        isTabHidden
                    });

                    // Mesaj gelen kanalı listenin en üstüne taşı
                    if (data.channel_id) {
                        dispatch(moveChannelToTop(data.channel_id));
                    }

                    // Bildirim Tetikleme: Farklı kanaldaysak VEYA sekme tamamen gizliyse
                    if (isDifferentChannel || isTabHidden) {

                        // Sadece farklı kanaldaysak okunmamış rozetini artır
                        if (isDifferentChannel && data.channel_id) {
                            dispatch(incrementUnreadCount(data.channel_id));
                        }

                        // Bildirim sesini başa alıp çal
                        notificationAudio.currentTime = 0;
                        notificationAudio.play().catch(err => {
                            console.log("Tarayıcı otomatik ses çalmayı engelledi:", err);
                        });

                        if (!isTabHidden) {
                            // DURUM 1: Sekme Ekranda Görünüyor -> SADECE Uygulama İçi Snackbar
                            dispatch(showNotification({
                                senderName: data.sender_name || 'Yeni Mesaj',
                                message: data.content || 'Sana bir mesaj gönderdi',
                                severity: 'info'
                            }));
                        } else if (isTabHidden && Notification.permission === 'granted') {
                            // DURUM 2: Sekme Arkada / Arka Planda -> SADECE Windows Bildirimi
                            new Notification(`Yeni Mesaj: ${data.sender_name || 'Biri'}`, {
                                body: data.content || 'Yeni bir mesajınız var.',
                                icon: '/favicon.ico',
                                silent: true
                            });
                        }
                    }
                    break;
                }

                default:
                    console.log('Tanımlanamayan bildirim tipi:', data.type);
                    break;
            }
        };

        ws.current.onerror = (error) => {
            console.error('Global WebSocket Hatası:', error);
        };

        ws.current.onclose = () => {
            console.log('Global WebSocket Bağlantısı Kapandı!');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [dispatch]);

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return ws.current;
};

export default useGlobalWebSocket;
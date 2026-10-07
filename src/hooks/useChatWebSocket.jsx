import { useCallback, useEffect, useRef } from "react"

export const useChatWebSocket = (url, onMessageReceived) => {
    const ws = useRef(null);

    // SİHİRLİ DOKUNUŞ: Gelen callback'i re-render'lardan korumak için ref içinde tutuyoruz.
    const savedCallback = useRef(onMessageReceived);

    // Parent component her güncellendiğinde sadece callback'i güncelleriz, sokete dokunmayız.
    useEffect(() => {
        savedCallback.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!url) return;

        ws.current = new WebSocket(url);
        ws.current.onopen = () => { console.log(" WebSocket Bağlandı:", url); }

        ws.current.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log(" WebSocket'ten Veri Geldi:", data);
                // Güncel callback'i ref üzerinden çağır
                if (savedCallback.current) {
                    savedCallback.current(data);
                }
            }
            catch (error) {
                console.error(" Gelen veri JSON değil:", error, "Gelen Veri:", e.data);
            }
        };

        ws.current.onerror = (error) => console.error(" WebSocket Hatası:", error);
        ws.current.onclose = () => console.log(" WebSocket Kapandı.");

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        }
    }, [url]); // DİKKAT: Artık sadece 'url' değişirse soket kapanıp açılacak!

    const sendMessage = useCallback((msgObject) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log(" WebSocket Üzerinden Mesaj Gönderiliyor:", msgObject);
            ws.current.send(JSON.stringify(msgObject));
        } else {
            console.error(" Bağlantı kapalı veya henüz açılamadı, mesaj gönderilemedi. Durum Kodu:", ws.current?.readyState);
        }
    }, []);

    return { sendMessage };
}
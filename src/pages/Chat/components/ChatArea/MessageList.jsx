import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChannelMessages } from '../../../../store/chatSlice';
import api from '../../../../api/axiosInstance';

const MessageList = () => {
    const dispatch = useDispatch();
    const { messages, activeChannel, loadingMessages } = useSelector((state) => state.chat);

    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    const isPrependingRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    const [hasMore, setHasMore] = useState(true);

    // GELİŞTİRİLMİŞ GÜVENLİ URL DÖNÜŞÜTÜRÜCÜ
    const getSafeFileUrl = (url) => {
        if (!url) return '';

        // Eğer URL localhost:9000 veya 127.0.0.1:9000 (MinIO) içeriyorsa:
        if (url.includes('localhost:9000') || url.includes('127.0.0.1:9000')) {
            try {
                const baseObj = new URL(api.defaults.baseURL);
                // MinIO portunu koruyarak hostname'i API'nin host adresiyle (192.168.12.250) değiştiriyoruz
                return url.replace(/localhost:9000|127\.0\.0\.1:9000/, `${baseObj.hostname}:9000`);
            } catch {
                const baseObj = new URL(api.defaults.baseURL);
                return url.replace('localhost', baseObj.hostname);
            }
        }

        // Eğer diğer tam bir http:// linkiyse aynen döndür
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Göreceli (relative) yollar için
        const cleanBase = api.defaults.baseURL.replace(/\/api\/v1\/?$/, '');
        return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setHasMore(true);
        isPrependingRef.current = false;
        isInitialLoadRef.current = true;
    }, [activeChannel?.id]);

    useEffect(() => {
        if (!containerRef.current || messages.length === 0) return;

        if (isPrependingRef.current) {
            isPrependingRef.current = false;
            return;
        }

        if (isInitialLoadRef.current) {
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                    setTimeout(() => {
                        isInitialLoadRef.current = false;
                    }, 150);
                }
            });
        } else {
            scrollToBottom();
        }
    }, [messages]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        if (isInitialLoadRef.current) return;

        const { scrollTop, scrollHeight } = containerRef.current;

        if (scrollTop <= 5 && !loadingMessages && hasMore && activeChannel?.id) {
            isPrependingRef.current = true;
            const previousScrollHeight = scrollHeight;

            dispatch(fetchChannelMessages({
                channelId: activeChannel.id,
                limit: 50,
                offset: messages.length
            }))
                .unwrap()
                .then((res) => {
                    const fetched = Array.isArray(res) ? res : (res?.data || res?.messages || []);

                    if (fetched.length < 50) {
                        setHasMore(false);
                    }

                    requestAnimationFrame(() => {
                        if (containerRef.current) {
                            const newScrollHeight = containerRef.current.scrollHeight;
                            containerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                        }
                    });
                })
                .catch(() => {
                    isPrependingRef.current = false;
                });
        }
    };

    const currentUserId = localStorage.getItem('userId');

    const formatTime = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    // YENİ VE HATASIZ İNDİRME FONKSİYONU (Fetch API ile yeni sayfa açmadan doğrudan indirir)
    const handleDownload = async (fileUrl, fileName) => {
        const safeUrl = getSafeFileUrl(fileUrl);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(safeUrl, {
                method: 'GET',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) throw new Error('İndirme başarısız oldu');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName || safeUrl.split('/').pop() || 'dosya');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn("Fetch ile indirilemedi, doğrudan bağlantı açılıyor...", error);
            // Fallback olarak yeni sekmede açmak yerine direkt konumlandır
            const link = document.createElement('a');
            link.href = safeUrl;
            link.setAttribute('download', fileName || 'dosya');
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>

            {loadingMessages && messages.length > 0 && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#6B7280' }}>
                    Eski mesajlar yükleniyor...
                </div>
            )}

            {messages.map((msg, index) => {
                const isOwnMessage = String(msg.sender_id) === String(currentUserId);
                const senderDisplayName = isOwnMessage
                    ? 'Sen'
                    : (msg.sender_name || activeChannel?.name || 'Kullanıcı');

                const safeFileUrl = getSafeFileUrl(msg.file_url);

                return (
                    <div key={msg.id || index} className={`message-box ${isOwnMessage ? 'own-message' : ''}`}>

                        <div
                            className="message-avatar"
                            style={isOwnMessage ? { backgroundColor: '#10B981', color: 'white' } : {}}
                        >
                            {senderDisplayName.charAt(0).toUpperCase()}
                        </div>

                        <div className="message-content">
                            <div className="message-content-header">
                                <span className="message-sender">
                                    {senderDisplayName}
                                </span>

                                <span className="message-time">
                                    {msg.created_at ? formatTime(msg.created_at) : (msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                                </span>
                            </div>

                            <div className="message-text">
                                {msg.content || msg.message}

                                {msg.file_url && (
                                    <div style={{ marginTop: '8px' }}>
                                        {msg.file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                            <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => handleDownload(msg.file_url, msg.file_name || msg.filename || 'resim')}>
                                                <img
                                                    src={safeFileUrl}
                                                    alt="Eklenen dosya"
                                                    style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                                                />
                                                <div style={{ fontSize: '0.75rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', position: 'absolute', bottom: '6px', right: '6px' }}>
                                                    İndir ⬇
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => handleDownload(msg.file_url, msg.file_name || msg.filename || msg.file_url.split('/').pop())}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 12px',
                                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                                    borderRadius: '6px',
                                                    color: 'var(--brand-primary, #4338CA)',
                                                    textDecoration: 'none',
                                                    fontSize: '0.85rem',
                                                    wordBreak: 'break-all',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                            >
                                                <span>📎</span>
                                                <span style={{ textDecoration: 'underline' }}>
                                                    {msg.file_name || msg.filename || msg.file_url.split('/').pop()}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>⬇</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
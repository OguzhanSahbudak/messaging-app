import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteChannelMessage, fetchChannelMessages, updateChannel, updateChannelMessage } from '../../../../store/chatSlice';
import api from '../../../../api/axiosInstance';
import { IconButton, Menu, MenuItem, TextField, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'; // TextField ve Button eklendi
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MdOutlineDeleteForever } from "react-icons/md";
import { FiEdit2 } from "react-icons/fi";


const MessageList = ({ searchQuery = '' }) => {
    const dispatch = useDispatch();
    const { messages, searchResults, activeChannel, loadingMessages } = useSelector((state) => state.chat);

    // Redux'tan üye listesini çekiyoruz (memberSlice içindeki 'list')
    const { list: members } = useSelector((state) => state.members);

    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    const isPrependingRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    const [hasMore, setHasMore] = useState(true);

    // ÜÇ NOKTA MENÜ STATE'LERİ
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // === MESAJ DÜZENLEME (EDIT) STATE'LERİ ===
    // Hangi mesajın düzenleme modunda olduğunu tutar (message id veya null)
    const [editingMessageId, setEditingMessageId] = useState(null)
    //düzenleme inputunun anlık metin içeriği
    const [editText, setEditText] = useState('');

    //silme onayı modalı state i
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)


    //Düzenleme inputunu yakalamak için ref
    const editInputRef = useRef(null);

    //Düzenleme modu açıldığı an imleci metnin sonuna konumlandırma
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            const length = editInputRef.current.value.length;
            editInputRef.current.focus();
            // İmleci metnin tam sonuna (length, length) taşıyoruz
            editInputRef.current.setSelectionRange(length, length);
        }
    }, [editingMessageId]);

    const handleMenuClick = (e, msg) => {
        if (e && e.currentTarget) {
            setAnchorEl(e.currentTarget);
        }
        setSelectedMessage(msg)
    }
    const handleMenuClose = () => {
        setAnchorEl(null);

    };

    //Silme onay modalını açma
    const handleOpenDeleteConfirm = () => {
        handleMenuClose();
        setDeleteDialogOpen(true);
    }

    // === SİLME ONAY MODALINI KAPATMA ===
    const handleCloseDeleteConfirm = () => {
        setDeleteDialogOpen(false);
        setSelectedMessage(null);
    };

    //mesaj silme function
    const handleConfirmDelete = () => {
        if (!selectedMessage || !activeChannel?.id) return;
        dispatch(deleteChannelMessage({
            channelId: activeChannel.id,
            messageId: selectedMessage.id
        }));
        handleCloseDeleteConfirm();
    }

    // === DÜZENLEME MODUNU BAŞLATMA FONKSİYONU ===
    const handleStartEdit = () => {
        if (!selectedMessage) return;
        setEditingMessageId(selectedMessage.id);
        setEditText(selectedMessage.content || selectedMessage.message || '');
        handleMenuClose();
    }

    //Düzenlemeyi iptal etme
    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText('');
    }

    // === GÜNCELLEMEYİ KAYDETME (API ÇAĞRISI) ===
    const handleSaveEdit = (msgId) => {
        if (!editText.trim() || !activeChannel?.id) return;
        dispatch(updateChannelMessage({
            channelId: activeChannel.id,
            messageId: msgId,
            content: editText.trim()
        }))
        setEditingMessageId(null);
        setEditText('');
    }

    // Klavye kısayolları (Enter ile kaydet, Escape ile iptal et)
    const handleKeyDown = (e, msgId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit(msgId);
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };



    // KİLİT HAMLE: Arama aktifse backend'den gelen searchResults'ı, değilse ana messages dizisini göster
    const isSearching = Boolean(searchQuery && searchQuery.trim() !== '');
    const displayedMessages = isSearching ? searchResults : messages;

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

    // AÇIKLAMA: SCROLL KONTROLÜ
    // Kullanıcı arama yapıyorsa (searchQuery doluysa), mesajlar değiştiğinde en alta otomatik kaydırmayı durduruyoruz.
    // Böylece aranan mesaj en altta kaybolup gitmiyor, kullanıcının gözünün önünde kalıyor.

    useEffect(() => {
        if (!containerRef.current || displayedMessages.length === 0) return;

        if (isPrependingRef.current) {
            isPrependingRef.current = false;
            return;
        }
        // Arama yapılıyorsa otomatik en alta kaydırmayı durdur
        if (isSearching) return;

        if (searchQuery && searchQuery.trim() !== '') {
            return; // eğer arama aktifse  en altta otomatik kaydırma yapma
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
    }, [displayedMessages, isSearching]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        if (isInitialLoadRef.current) return;

        // Arama aktifken scroll-pagination yapıp offset'i bozma
        if (isSearching) return;



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

    //Bugün, Dün veya Tarih hesaplayan fonksiyon
    const getDateSeparatorText = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const now = new Date();

            const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const diffDays = Math.round((today - messageDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Bugün';
            } else if (diffDays === 1) {
                return 'Dün';
            } else if (date.getFullYear() === now.getFullYear()) {
                return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
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
        <div className="chat-messages" ref={containerRef} onScroll={handleScroll}  >

            {loadingMessages && messages.length > 0 && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#6B7280' }}>
                    Eski mesajlar yükleniyor...
                </div>
            )}

            {/* Artık displayedMessages haritalanıyor (Arama varsa arama sonuçları, yoksa taze mesajlar) */}
            {displayedMessages.map((msg, index) => {
                const isOwnMessage = String(msg.sender_id) === String(currentUserId);
                // 🔍 Üye listesinden sender_id ile eşleşen kişiyi buluyoruz 
                // (memberSlice'ındaki yapıya tam uyumlu ID kontrolü)
                let foundSenderName = 'Kullanıcı';
                if (!isOwnMessage && members && members.length > 0) {
                    const foundMember = members.find(m =>
                        String(m.user_id || m.id || m.user?.id) === String(msg.sender_id)
                    );
                    if (foundMember) {
                        foundSenderName = (foundMember.first_name || foundMember.last_name)
                            ? `${foundMember.first_name || ''} ${foundMember.last_name || ''}`.trim()
                            : (foundMember.email || foundMember.user?.first_name || 'Kullanıcı');
                    }
                }

                const senderDisplayName = isOwnMessage
                    ? 'Sen'
                    : (msg.sender_name || msg.user_name || msg.username || foundSenderName);

                const safeFileUrl = getSafeFileUrl(msg.file_url);
                const messageText = msg.content || msg.message || '';

                const isHighlighted = isSearching && messageText.toLowerCase().includes(searchQuery.toLowerCase());

                // Bu mesaj şu an düzenleme modunda mı?
                const isEditing = editingMessageId === msg.id;

                // WhatsApp Tarzı Tarih Ayırıcı Kontrolü
                const currentDateText = getDateSeparatorText(msg.created_at);
                const prevMessage = displayedMessages[index - 1];
                const prevDateText = prevMessage ? getDateSeparatorText(prevMessage.created_at) : null;

                // Eğer bu ilk mesajsa veya bir önceki mesajdan farklı bir güne aitse tarih başlığı göster
                const showDateSeparator = index === 0 || currentDateText !== prevDateText;

                return (
                    <React.Fragment key={`${msg.id || 'msg'}-${index}`}>
                        {/* WhatsApp Tarzı Tarih Bandı */}
                        {showDateSeparator && currentDateText && (
                            <div className='message-date-separator' >
                                <span className='message-date-badge'>
                                    {currentDateText}
                                </span>
                            </div>
                        )}

                        <div className={`message-box  ${isOwnMessage ? 'own-message' : ''}`}
                            // AÇIKLAMA: OTOMATİK ODAKLANMA SCROLL TO MATCH
                            // Eğer bu mesaj aranan kelimeyi içeriyorsa, ekran animasyonlu bir şekilde bu mesaja kayarak ortalar.

                            ref={isHighlighted ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : null}
                            style={{
                                position: 'relative',
                                backgroundColor: isHighlighted ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                                borderLeft: isHighlighted ? '4px solid #F59E0B' : '4px solid transparent',
                                paddingTop: '6px',
                                paddingBottom: '6px',
                                paddingRight: '8px',
                                paddingLeft: isHighlighted ? '12px' : '8px',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                wordBreak: 'break-word'
                            }}
                        >



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

                                {/* Mesaj metni / Düzenleme modu görünümü */}
                                <div className="message-text">
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '250px' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, msg.id)}
                                                autoFocus
                                                inputRef={editInputRef}
                                                multiline
                                                sx={{ backgroundColor: '#fff', borderRadius: '4px' }}
                                            />
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Button
                                                    size="small"
                                                    onClick={handleCancelEdit}
                                                    sx={{ textTransform: 'none', color: '#6B7280', fontSize: '0.75rem' }}
                                                >
                                                    İptal
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleSaveEdit(msg.id)}
                                                    sx={{ textTransform: 'none', backgroundColor: 'var(--brand-primary)', fontSize: '0.75rem' }}
                                                >
                                                    Kaydet
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messageText}

                                            {isOwnMessage && (
                                                <div className="message-actions-hover">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuClick(e, msg)}
                                                        sx={{ color: 'var(--text-muted)', padding: '2px' }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {msg.file_url && !isEditing && (
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
                    </React.Fragment>
                );
            })}
            {/* === AÇILIR İŞLEM MENÜSÜ (DROPDOWN) === */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                slotProps={{
                    paper: {
                        elevation: 2,
                        sx: { minWidth: '120px', borderRadius: '8px' }
                    }
                }}
            >
                {/* 1. Düzenle Seçeneği */}
                <MenuItem onClick={handleStartEdit} sx={{ color: 'var(--text-dark)', fontSize: '0.95rem', gap: '8px' }}>
                    <FiEdit2 /> Düzenle
                </MenuItem>

                {/* 2. Sil Seçeneği */}
                <MenuItem onClick={handleOpenDeleteConfirm} sx={{ color: '#EF4444', fontSize: '1rem', gap: '8px' }}>
                    <MdOutlineDeleteForever /> Sil
                </MenuItem>
            </Menu>

            {/* === SİLME ONAY MODALI (DIALOG) === */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteConfirm}
                PaperProps={{
                    sx: { borderRadius: '12px', padding: '8px', minWidth: '320px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Mesajı Sil
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-muted)' }}>
                        Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button
                        onClick={handleCloseDeleteConfirm}
                        sx={{ textTransform: 'none', color: '#6B7280' }}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none', borderRadius: '6px' }}
                    >
                        Evet, Sil
                    </Button>
                </DialogActions>
            </Dialog>

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
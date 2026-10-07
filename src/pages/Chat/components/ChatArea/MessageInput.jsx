import React, { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBoldRounded';
import FormatItalicIcon from '@mui/icons-material/FormatItalicRounded';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const MessageInput = ({ activeUser, activeChannel, sendMessage , sendFileMessage }) => {
    const [message, setMessage] = useState('');
    const [selectedFile , setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // YENİ EKLENDİ: Üst üste hızlı tıklamalarda / enter basmalarında çift gönderimi önleyen kilit
    const isSendingRef = useRef(false);

    const recipientName = (activeUser?.first_name || activeUser?.last_name)
        ? `${activeUser.first_name || ''} ${activeUser.last_name || ''}`.trim()
        : activeUser?.email || 'kullanıcıya';

    let placeholderText = 'Mesaj gönder...';
    if (activeUser) {
        placeholderText = `${recipientName} kişisine mesaj gönder...`;
    } else if (activeChannel) {
        placeholderText = `# ${activeChannel.name} kanalına mesaj gönder...`;
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleAttachClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSend = () => {
        if (!message.trim() && !selectedFile) return;

        // Eğer halihazırda bir gönderim süreci devam ediyorsa ikinci isteği atma!
        if (isSendingRef.current) return;
        isSendingRef.current = true;

        if (selectedFile) {
            sendFileMessage(selectedFile, message.trim());
            setSelectedFile(null);
            setMessage('');
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            
            // Gönderim bittikten kısa bir süre sonra kilidi tekrar açıyoruz
            setTimeout(() => {
                isSendingRef.current = false;
            }, 400);
            return;
        }

        const payload = {
            content: message.trim(),
            ...(activeUser && { receiver_id: activeUser.id }),
            ...(activeChannel && { channel_id: activeChannel.id })
        };

        sendMessage(payload);
        setMessage('');

        // Kilidi tekrar açıyoruz
        setTimeout(() => {
            isSendingRef.current = false;
        }, 400);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-container">
            {selectedFile && (
                <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F3F4F6', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #E5E7EB' }}>
                    <AttachFileIcon fontSize="small" sx={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <IconButton size="small" onClick={() => setSelectedFile(null)}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </div>
            )}
            <div className="chat-input-wrapper">
                <div className="chat-input-toolbar">
                    <IconButton size="small" sx={{ color: 'var(--text-muted)' }}><FormatBoldIcon fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: 'var(--text-muted)' }}><FormatItalicIcon fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: 'var(--text-muted)' }} onClick={handleAttachClick}><AttachFileIcon fontSize="small" /></IconButton>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                    />
                    <IconButton size="small" sx={{ color: 'var(--text-muted)' }}><AlternateEmailRoundedIcon fontSize="small" /></IconButton>
                </div>
                <textarea
                    className="chat-input"
                    placeholder={placeholderText}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="chat-input-footer">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Yeni satır için <strong>Shift + Enter</strong> kullanın
                    </div>
                    <IconButton
                        onClick={handleSend}
                        sx={{
                            bgcolor: (message.trim() || selectedFile) ? 'var(--brand-primary)' : 'var(--bg-page)',
                            color: (message.trim() || selectedFile) ? 'white' : 'var(--text-muted)',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: (message.trim() || selectedFile) ? '#4338CA' : 'var(--bg-page)'
                            }
                        }}
                        disabled={!message.trim() && !selectedFile}
                    >
                        <SendRoundedIcon fontSize="small" />
                    </IconButton>
                </div>
            </div>
        </div>
    );
};

export default MessageInput;
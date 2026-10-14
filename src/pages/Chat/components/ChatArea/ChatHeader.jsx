import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { clearSearchResults, fetchChannelMessages, searchChannelMessages } from '../../../../store/chatSlice';

const ChatHeader = ({ onMenuClick, searchQuery, setSearchQuery }) => {
    const dispatch = useDispatch();
    const { activeChannel, activeUser } = useSelector((state) => state.chat);

    const displayName = (activeUser?.first_name || activeUser?.last_name)
        ? `${activeUser.first_name || ''} ${activeUser.last_name || ''}`.trim()
        : activeUser?.email || 'Seçili Kullanıcı Yok';

    const avatarLetter = displayName.charAt(0).toUpperCase();

    const handleSearchChange = (e) => {
        const query = e.target.value;
        
        // 1. Arama kelimesini üst bileşene (fosfor ve scroll için) bildiriyoruz
        setSearchQuery(query);

        if (!activeChannel?.id) return;

        if (!query.trim()) {
            // Arama kutusu temizlendiyse normal kanal mesajlarını geri yükle
           dispatch(clearSearchResults())
        } else {
            // 2. BACKEND ARAMA İSTEĞİ (İstediğin gibi faal ve çalışır durumda)
            dispatch(searchChannelMessages({
                channelId: activeChannel.id,
                query: query.trim()
            }));
        }
    };

    return (
        <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconButton 
                    sx={{ display: { xs: 'block', md: 'none' }, color: 'var(--text-dark)' }} 
                    onClick={onMenuClick}
                >
                    <MenuRoundedIcon />
                </IconButton>

                {activeChannel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>
                                    # {activeChannel.name}
                                </h4>
                            </div>
                            
                            {activeChannel.description && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {activeChannel.description}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="message-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                            {avatarLetter}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>
                                {displayName}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#10B981' }}>
                                ● Çevrimiçi
                            </span>
                        </div>
                    </div>
                )}
            </div>
        
            <div className="search-box">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'var(--text-muted)' }} />
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Sohbette ara..." 
                    value={searchQuery || ''} 
                    onChange={handleSearchChange}
                />
            </div>
        </div>
    );
};

export default ChatHeader;
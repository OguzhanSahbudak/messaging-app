
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { fetchChannelMessages, searchChannelMessages } from '../../../../store/chatSlice';
import { act } from 'react';


const ChatHeader = ({ onMenuClick , searchQuery , setSearchQuery }) => {

    const dispatch=useDispatch();
    // GÜNCELLEME: Hem activeChannel hem activeUser doğrudan Redux'tan çekiliyor
    const { activeChannel, activeUser } = useSelector((state) => state.chat);


    

    const displayName=(activeUser?.first_name || activeUser?.last_name)
    ? `${activeUser.first_name || ''} ${activeUser.last_name || '' }`.trim()
    :activeUser?.email || 'Seçili Kullanıcı Yok';

    const avatarLetter=displayName.charAt(0).toUpperCase();

   const handleSearchChange=(e)=>{
    const query=e.target.value;
    setSearchQuery(query);
    // Üst bileşene (ChatArea) aranan kelimeyi bildiriyoruz ki fosfor efekti verilebilsin
        if (setSearchQueryState) {
            setSearchQueryState(query);
        }
        if(!activeChannel?.id){return;}
        if(!query.trim())
        {
            // Arama kutusu temizlendiyse normal kanal mesajlarını geri yükle
            dispatch(fetchChannelMessages(activeChannel.id))
        }
        else
        {
            //anlık olarak backende arama isteği at
            dispatch(searchChannelMessages({
                channelId:activeChannel.id,
                query:query.trim()
            }));
        }

   }

    return (
        <>
       
        <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconButton 
                    sx={{ display: { xs: 'block', md: 'none' }, color: 'var(--text-dark)' }} 
                    onClick={onMenuClick}
                >
                    <MenuRoundedIcon />
                </IconButton>


                
                {/* Active Channel varsa Kanal Başlığı, yoksa Kullanıcı Bilgisi */}
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
                        /* Seçili Kullanıcı Bilgisi (DM) */
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
                <input type="text" className="search-input" placeholder="Sohbette ara..."
                value={searchQuery || ''}  onChange={handleSearchChange}/>
            </div>
        </div>
        
       

             </>

    );
};

export default ChatHeader;
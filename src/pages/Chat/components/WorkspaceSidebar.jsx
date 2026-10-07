import React, { useEffect } from 'react';
import { fetchChannelMembers } from '../../../store/membersSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannelMessages, fetchMyDms, setActiveChannel, setActiveUser, startOrGetDM } from '../../../store/chatSlice';
import { Badge } from '@mui/material';
import { clearUnreadCount } from '../../../store/notificationSlice';

const WorkspaceSidebar = ({ isOpen, activeUserId, onSelectUser, channelId }) => {
   
    const dispatch=useDispatch();
    const {list:members , loading :membersLoading}=useSelector((state)=> state.members);
   const { activeUser, activeChannel, activeTab, dmList, loadingDms } = useSelector((state) => state.chat);

   // 2. REDUX'TAN OKUNMAMIŞ MESAJ SAYILARINI ÇEKİYORUZ: { "user_id": 3, "channel_id": 1 }
    const { unreadCounts } = useSelector((state) => state.notification);

   // Channel ID değişirse veya sayfa ilk açılırsa kanal üyelerini çek
    useEffect(() => {
        if (channelId && activeTab === 'home') {
            dispatch(fetchChannelMembers(channelId));
        }
    }, [dispatch, channelId, activeTab]);

   // DMs sekmesindeysek listenin güncel kalmasını sağla
    useEffect(() => {
        if (activeTab === 'dms') {
            dispatch(fetchMyDms());
        }
    }, [dispatch, activeTab]);

    // === YENİ: Home sekmesinde kullanıcıya tıklandığında ===
    const handleHomeUserClick = async (member) => {
        dispatch(setActiveUser(member));

        // TIKLANAN KULLANICININ BİLDİRİM SAYISINI SIFIRLA
        dispatch(clearUnreadCount(member.id));
        
        // 1. DM Kanal ID'sini al/oluştur (POST /api/v1/channels/dm)
        const resultAction = await dispatch(startOrGetDM(member.id));
        
        if (startOrGetDM.fulfilled.match(resultAction)) {
            const channelObj = resultAction.payload;
            dispatch(setActiveChannel(channelObj));

            // Eğer kanal id'si ile de tutuyorsan onu da sıfırla
            dispatch(clearUnreadCount(channelObj.id));

            // 2. O kanalın geçmiş mesajlarını getir (GET /api/v1/channels/{channel_id}/messages)
            dispatch(fetchChannelMessages({ channelId: channelObj.id }));
        }
    };

    // === YENİ: DMs sekmesinde sohbet odasına tıklandığında ===
    const handleDMChannelClick = (channel) => {
        dispatch(setActiveChannel(channel));
        dispatch(setActiveUser({ id: channel.id, first_name: channel.name }));

        // TIKLANAN KANALIN BİLDİRİM SAYISINI SIFIRLA
        dispatch(clearUnreadCount(channel.id));
        
        // Kanalın geçmiş mesajlarını getir
        dispatch(fetchChannelMessages({ channelId: channel.id }));
    };



    return (
        <div className={`workspace-sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="workspace-header">
                Mesajlar
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <span>{activeTab === 'home' ? 'SOHBETLER' : 'ÖZEL MESAJLAR (DMs)'}</span>
                    <span className="add-btn">+</span>
                </div>
                
                {/* === HOME SEKMESİ LİSTESİ === */}
                {activeTab === 'home' && (
                    membersLoading ? (
                        <div style={{ padding: '10px', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                    ) : (
                        members.map((member) => {
                            const displayName = (member.first_name || member.last_name)
                                ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                                : member.email;

                            const isSelected = activeUser?.id === member.id;
                            // Bu kullanıcının okunmamış mesaj sayısı
                            const unreadNum = unreadCounts[member.id] || 0;
                            
                            return (
                                <div 
                                    key={member.id}
                                    className={`sidebar-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleHomeUserClick(member)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        color: member.is_online ? '#10B981' : '#9CA3AF', 
                                        fontSize: '1.2rem'
                                    }}>•</span>
                                    <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                        {displayName}
                                    </span>
                                </div>
                                    <Badge 
                                        badgeContent={unreadNum} 
                                        color="error" 
                                        max={99}
                                    />
                                </div>

                                
                            );
                        })
                    )
                )}

                {/* === DMs SEKMESİ LİSTESİ === */}
                {activeTab === 'dms' && (
                    loadingDms ? (
                        <div style={{ padding: '10px', color: 'var(--text-muted)' }}>DM'ler Yükleniyor...</div>
                    ) : dmList.length === 0 ? (
                        <div style={{ padding: '10px', color: 'var(--text-muted)' }}>Henüz özel mesaj yok.</div>
                    ) : (
                        dmList.map((dmChannel) => {
                            const isSelected = activeChannel?.id === dmChannel.id;

                            // Kanal ID veya DM Target User ID üzerinden kontrol
                            const unreadNum = unreadCounts[dmChannel.id] || 0;
                            
                            return (
                                <div 
                                    key={dmChannel.id}
                                    className={`sidebar-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleDMChannelClick(dmChannel)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',paddingRight: '12px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#10B981', fontSize: '1.2rem' }}>•</span>
                                    <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                        {dmChannel.name || 'Özel Sohbet'}
                                    </span>
                                    </div>
                                    {/* KANAL BADGE */}
                                    <Badge 
                                        badgeContent={unreadNum} 
                                        color="error" 
                                        max={99}
                                    />
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
    
};

export default WorkspaceSidebar;
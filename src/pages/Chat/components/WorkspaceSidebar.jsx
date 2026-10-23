import React, { useEffect, useState } from 'react';
import { fetchChannelMembers } from '../../../store/membersSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannelMessages, fetchMyDms, fetchChannels, setActiveChannel, setActiveUser, startOrGetDM, deleteDMConversation } from '../../../store/chatSlice';
import { Badge, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'; 
import { MdOutlineDeleteForever } from "react-icons/md";
import { clearUnreadCount } from '../../../store/notificationSlice';
import '../Sidebar.css'


const WorkspaceSidebar = ({ isOpen, activeUserId, onSelectUser, channelId }) => {
   
    const dispatch = useDispatch();
    const { searchList: members, loading: membersLoading } = useSelector((state) => state.members);
    // === YENİ: Redux'tan ortak kanalları çekiyoruz ===
    const { activeUser, activeChannel, activeTab, dmList, channels, loadingDms } = useSelector((state) => state.chat);

    // 2. REDUX'TAN OKUNMAMIŞ MESAJ SAYILARINI ÇEKİYORUZ
    const { unreadCounts } = useSelector((state) => state.notification);

    //Arama metnini tutacak state
    const [memberSearchQuery , setMemberSearchQuery]=useState('');

    //silinecek dm i tutan state ve onay modalı state'i
    const [dmToDelete , setDmToDelete]=useState(null);
    
    //çöp kutusuna tıklandığında çalışır
    const handleDeleteClick=(e , dmChannel) =>{
        e.stopPropagation();
        setDmToDelete(dmChannel);
    };

    const confirmDeleteDM=()=>{
        if(dmToDelete)
        {
            dispatch(deleteDMConversation(dmToDelete.id));
            setDmToDelete(null);

        }
    }



    // === YENİ: Sayfa ilk açıldığında veya sekme değiştiğinde ortak kanalları da çek ===
    useEffect(() => {
        dispatch(fetchChannels());
    }, [dispatch]);

   // Channel ID değişirse veya sayfa ilk açılırsa kanal üyelerini çek search mantığıda burda
    useEffect(() => {
        if (channelId && activeTab === 'home') {
            const delayDebounceFn=setTimeout(()=>{
                dispatch(fetchChannelMembers({
                    channelId:channelId,
                    searchQuery:memberSearchQuery //state deki metni backende yolluyoruz
                }));
            },200)
            return ()=>clearTimeout(delayDebounceFn); //Kullanıcı 500ms dolmadan yeni harf basarsa önceki sayacı sıfırlar
        }
    }, [dispatch, channelId, activeTab,memberSearchQuery]);

   // DMs sekmesindeysek listenin güncel kalmasını sağla
    useEffect(() => {
        if (activeTab === 'dms') {
            dispatch(fetchMyDms());
        }
    }, [dispatch, activeTab]);

    // === YENİ: Ortak Kanala (Örn: Hanet) tıklandığında çalışacak fonksiyon ===
    const handleChannelClick = (channel) => {
        dispatch(setActiveChannel(channel));
        dispatch(setActiveUser(null));
        dispatch(clearUnreadCount(channel.id));
        dispatch(fetchChannelMessages({ channelId: channel.id }));
    };

    // === Home sekmesinde kullanıcıya tıklandığında ===
    const handleHomeUserClick = async (member) => {
        dispatch(setActiveUser(member));
        dispatch(clearUnreadCount(member.id));
        
        const resultAction = await dispatch(startOrGetDM(member.id));
        
        if (startOrGetDM.fulfilled.match(resultAction)) {
            const channelObj = resultAction.payload;
            dispatch(setActiveChannel(channelObj));
            dispatch(clearUnreadCount(channelObj.id));
            dispatch(fetchChannelMessages({ channelId: channelObj.id }));
        }
    };

    // === DMs sekmesinde sohbet odasına tıklandığında ===
    const handleDMChannelClick = (channel) => {
        dispatch(setActiveChannel(channel));
        dispatch(setActiveUser({ id: channel.id, first_name: channel.name }));
        dispatch(clearUnreadCount(channel.id));
        dispatch(fetchChannelMessages({ channelId: channel.id }));
    };

    return (
        <div className={`workspace-sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="workspace-header">
                Mesajlar
            </div>

            {/* === YENİ: ORTAK KANALLAR (ŞİRKET KANALI - HANET) HER İKİ SEKMEDE DE SABİT GÖZÜKECEK === */}
            <div className="sidebar-section" style={{ marginBottom: '15px' }}>
                <div className="sidebar-section-title">
                    <span>ŞİRKET KANALI</span>
                </div>
                {channels && channels.map((channel) => {
                    const isSelected = activeChannel?.id === channel.id;
                    const unreadNum = unreadCounts[channel.id] || 0;

                    return (
                        <div
                            key={channel.id}
                            className={`sidebar-item ${isSelected ? 'active' : ''}`}
                            onClick={() => handleChannelClick(channel)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#3B82F6', fontSize: '1rem', fontWeight: 'bold' }}>#</span>
                                <span style={{ fontSize: '0.9rem', wordBreak: 'break-all', fontWeight: isSelected ? '600' : 'normal' }}>
                                    {channel.name}
                                </span>
                            </div>
                            <Badge 
                                badgeContent={unreadNum} 
                                color="error" 
                                max={99}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <span>{activeTab === 'home' ? 'SOHBETLER' : 'ÖZEL MESAJLAR (DMs)'}</span>
                    <span className="add-btn">+</span>
                </div>
                
                {/* === HOME SEKMESİ LİSTESİ === */}
                {activeTab==='home' &&(
                    <div className='sidebar-search-container'>
                        <input type="text" className='sidebar-search-input' placeholder='Kullanıcı ara...' value={memberSearchQuery}
                        onChange={(e)=>setMemberSearchQuery(e.target.value)} />
                    </div>
                )}
                {activeTab === 'home' && (
                    membersLoading ? (
                        <div style={{ padding: '10px', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                    ) : members.length===0 ? (
                        <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kullanıcı bulunamadı.</div>
                    ): (
                        members.map((member) => {
                            const displayName = (member.first_name || member.last_name)
                                ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                                : member.email;

                            const isSelected = activeUser?.id === member.id;
                            const unreadNum = unreadCounts[member.id] || 0;
                            
                            return (
                                <div 
                                    key={member.id}
                                    className={`sidebar-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleHomeUserClick(member)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}
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
                            const unreadNum = unreadCounts[dmChannel.id] || 0;
                            
                            return (
                                <div 
                                    key={dmChannel.id}
                                    className={`sidebar-item ${isSelected ? 'active' : ''} dm-sidebar-item`}
                                    onClick={() => handleDMChannelClick(dmChannel)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#10B981', fontSize: '1.2rem' }}>•</span>
                                    <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                        {dmChannel.name || 'Özel Sohbet'}
                                    </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Badge 
                                        badgeContent={unreadNum} 
                                        color="error" 
                                        max={99}
                                    />
                                    <IconButton size='small' onClick={(e)=>handleDeleteClick(e,dmChannel)}
                                        sx={{ color: '#EF4444', padding: '4px' }} className='dm-delete-btn'>
                                        <MdOutlineDeleteForever fontSize="small" />
                                    </IconButton>
                                    </div>
                                    
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* === YENİ: DM SİLME ONAY MODALI === */}
            <Dialog
                open={Boolean(dmToDelete)}
                onClose={() => setDmToDelete(null)}
                PaperProps={{ sx: { borderRadius: '12px', padding: '8px', minWidth: '320px' } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Sohbeti Sil
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-muted)' }}>
                        <strong style={{color: '#1F2937'}}>{dmToDelete?.name}</strong> ile olan tüm sohbet geçmişini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button onClick={() => setDmToDelete(null)} sx={{ textTransform: 'none', color: '#6B7280' }}>
                        İptal
                    </Button>
                    <Button onClick={confirmDeleteDM} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: '6px' }}>
                        Evet, Kalıcı Olarak Sil
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default WorkspaceSidebar;
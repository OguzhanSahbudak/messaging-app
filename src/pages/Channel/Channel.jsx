import React, { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Alert, Badge } from '@mui/material';
// === DEĞİŞİKLİK 1: API'yi sildik çünkü veriyi Redux Thunk çekecek ===
import './channel.css';
import CreateModal from './components/CreateModal';
import InviteModal from './components/InviteModal';
import DeleteModal from './components/DeleteModal';
import { useNavigate } from 'react-router-dom';
// === DEĞİŞİKLİK 2: useSelector ve fetchChannels eklendi ===
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChannel, setActiveUser, fetchChannels, markChannelAsRead } from '../../store/chatSlice';
import { clearUnreadCount } from '../../store/notificationSlice';

const Channel = () => {
    // === DEĞİŞİKLİK 3: Kanalları ve Okunmamış Sayıları Redux'tan canlı olarak çekiyoruz ===
    const { channels } = useSelector((state) => state.chat);
    const { unreadCounts } = useSelector((state) => state.notification);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [inviteConfig, setInviteConfig] = useState({ open: false, channelId: null });
    const [deleteConfig, setDeleteConfig] = useState({ open: false, channelId: null });

    // === DEĞİŞİKLİK 4: Kendi API isteği yerine Redux Thunk'ı tetikliyoruz ===
    useEffect(() => {
        if (channels && channels.length > 0) {
            setIsLoading(false);
            return; // Burada dur, aşağıdaki API isteğini ATMA!
        }
        dispatch(fetchChannels())
            .unwrap() // Thunk başarılı olursa try içine düşer
            .catch((error) => {
                setErrorMessage('Kanallar yüklenirken bir sorun oluştu.');
                console.error("Kanallar çekilirken hata oluştu", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [dispatch, channels?.length]);

    const handleSuccess = (msg) => setSuccessMessage(msg);
    const handleError = (msg) => setErrorMessage(msg);

    if (isLoading) {
        return (
            <div className='channel-loading-wrapper'>
                <CircularProgress size={50} />
            </div>
        )
    }

    return (
        <>
            <div className='channel-page-wrapper'>
                <div className='channel-card'>
                    {errorMessage && <Alert severity="error" className='channel-alert' sx={{ mb: 2 }}>{errorMessage}</Alert>}
                    {successMessage && <Alert severity="success" className='channel-alert' sx={{ mb: 2 }}>{successMessage}</Alert>}

                    <div className='channel-list-container'>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <h3 className='channel-list-title' style={{ margin: 0 }}>Kanal Listeniz</h3>
                            <Button variant='contained' color='primary' onClick={() => { setErrorMessage(''); setSuccessMessage(''); setIsCreateOpen(true); }}>
                                + Yeni Kanal
                            </Button>
                        </Box>

                        {(!channels || channels.length === 0) ? (
                            <p className='channel-subtitle' style={{ textAlign: 'center', marginTop: '2rem' }}>
                                Henüz hiçbir kanalda bulunmuyorsunuz.
                            </p>
                        ) : (
                            <ul className='channel-list'>
                                {channels.map((channel) => (
                                    <li key={channel.id} className='channel-list-item'>
                                        <div className='channel-item-content'>

                                            <h4 className='channel-item-name'>
                                                <Badge
                                                    // === DEĞİŞİKLİK 5: Rozet içeriği artık Redux'tan gelen CANLI (Real-time) veri! ===
                                                    badgeContent={unreadCounts[channel.id] || 0}
                                                    color="error"
                                                    max={99}
                                                    sx={{
                                                        '& .MuiBadge-badge': {
                                                            position: 'static',
                                                            transform: 'none',
                                                            marginRight: '8px' // İsimle arasına ufak bir boşluk iyi gider
                                                        }
                                                    }}
                                                />
                                                {channel.name}
                                            </h4>
                                            <p className='channel-item-desc'>{channel.description}</p>
                                        </div>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            {channel.role === 'admin' && (
                                                <Button variant='outlined' color="error" size='small'
                                                    onClick={() => { setErrorMessage(''); setSuccessMessage(''); setDeleteConfig({ open: true, channelId: channel.id }); }}>
                                                    Sil
                                                </Button>
                                            )}
                                            {channel.role === 'admin' && (
                                                <Button variant='outlined' color="secondary" size='small'
                                                    onClick={() => { setErrorMessage(''); setSuccessMessage(''); setInviteConfig({ open: true, channelId: channel.id }); }}>
                                                    Davet Et
                                                </Button>
                                            )}
                                            <Button
                                                variant='outlined'
                                                size='small'
                                                onClick={() => {
                                                    // 1. Tıklar tıklamaz Optimistic UI ile ekrandan rozeti sil
                                                    dispatch(clearUnreadCount(channel.id));

                                                    // 2. Anında Backend'e /read isteğini fırlat! (Artık iptal olma şansı yok)
                                                    dispatch(markChannelAsRead(channel.id));
                                                    dispatch(setActiveChannel(channel));
                                                    dispatch(setActiveUser(null));
                                                    navigate(`/chat/${channel.id}`);
                                                }}
                                            >
                                                Kanalı Aç
                                            </Button>
                                        </Box>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Modallar */}
                <CreateModal
                    open={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={(newChannel, msg) => {
                        // Not: Yeni kanal eklendiğinde bunu da Redux'a fırlatman daha temiz olur (ileride chatSlice'a eklersin) ama şimdilik sayfayı yenilemek de iş çözer
                        dispatch(fetchChannels());
                        handleSuccess(msg);
                    }}
                    onError={handleError}
                />

                <InviteModal open={inviteConfig.open} channelId={inviteConfig.channelId} onClose={() => setInviteConfig({ open: false, channelId: null })} onSuccess={handleSuccess} onError={handleError} />

                <DeleteModal
                    open={deleteConfig.open}
                    channelId={deleteConfig.channelId}
                    onClose={() => setDeleteConfig({ open: false, channelId: null })}
                    onSuccess={(deletedId, msg) => {
                        // Silme işleminden sonra listeyi yenilemek için
                        dispatch(fetchChannels());
                        handleSuccess(msg);
                    }}
                    onError={handleError}
                />
            </div>
        </>
    )
}

export default Channel;
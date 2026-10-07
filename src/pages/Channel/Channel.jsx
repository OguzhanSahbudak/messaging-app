import React, { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Alert } from '@mui/material';
import api from '../../api/axiosInstance';
import './channel.css';
import CreateModal from './components/CreateModal';
import InviteModal from './components/InviteModal';
import DeleteModal from './components/DeleteModal';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setActiveChannel, setActiveUser } from '../../store/chatSlice';

const Channel = () => {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


    const navigate = useNavigate();
    const dispatch = useDispatch();


    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [inviteConfig, setInviteConfig] = useState({ open: false, channelId: null });
    const [deleteConfig, setDeleteConfig] = useState({ open: false, channelId: null });





    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await api.get('channels/');
                console.log(response.data);
                setChannels(response.data);

            }
            catch (error) {
                setErrorMessage('Kanallar yüklenirken bir sorun oluştu.');
                console.error("Kanallar çekilirken hata oluştu", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchChannels();
    }, []);

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

                        {channels.length === 0 ? (
                            <p className='channel-subtitle' style={{ textAlign: 'center', marginTop: '2rem' }}>
                                Henüz hiçbir kanalda bulunmuyorsunuz.
                            </p>
                        ) : (
                            <ul className='channel-list'>
                                {channels.map((channel) => (
                                    <li key={channel.id} className='channel-list-item'>
                                        <div className='channel-item-content'>
                                            <h4 className='channel-item-name'>{channel.name}</h4>
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
                                                    dispatch(setActiveChannel(channel)); // Kanalı aktif olarak Redux'a kaydet
                                                    dispatch(setActiveUser(null));       // Aktif kişiyi sıfırla ki kanal öne çıksın
                                                    navigate(`/chat/${channel.id}`);     // Sayfaya yönlendir
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

                {/* İzole Edilmiş Modallar */}
                <CreateModal
                    open={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={(newChannel, msg) => {
                        // Kanalı biz oluşturduğumuz için otomatik olarak role: 'admin' ekliyoruz
                        const channelWithRole = { ...newChannel, role: 'admin' };
                        setChannels(prev => [...prev, channelWithRole]);
                        handleSuccess(msg);
                    }}
                    onError={handleError}
                />

                <InviteModal
                    open={inviteConfig.open}
                    channelId={inviteConfig.channelId}
                    onClose={() => setInviteConfig({ open: false, channelId: null })}
                    onSuccess={handleSuccess}
                    onError={handleError}
                />

                <DeleteModal
                    open={deleteConfig.open}
                    channelId={deleteConfig.channelId}
                    onClose={() => setDeleteConfig({ open: false, channelId: null })}
                    onSuccess={(deletedId, msg) => { setChannels(channels.filter(c => c.id !== deletedId)); handleSuccess(msg); }}
                    onError={handleError}
                />
            </div>

        </>


    )

}

export default Channel;


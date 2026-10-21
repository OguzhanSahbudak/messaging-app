import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannelMembers, updateChannelMember, removeChannelMember } from '../../../../store/membersSlice';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';

// === İÇE AKTARILAN YENİ ALT BİLEŞENLER (Temiz Mimari) ===
import EditChannelModal from './EditChannelModal';
import ProfileSettings from './ProfileSettings'; // Kendi oluşturduğumuz bileşen
import MemberManagement from './MemberManagement'; // Kendi oluşturduğumuz bileşen
import ConfirmDialog from '../../../../components/common/ConfirmDialog'; // Kendi oluşturduğumuz evrensel onay modalı

const SettingsModal = ({ open, onClose }) => {
    const dispatch = useDispatch();

    const activeChannel = useSelector((state) => state.chat.activeChannel);
    const channelMembers = useSelector((state) => state.members.list || []);

    const [settingsView, setSettingsView] = useState('menu');
    const [loading, setLoading] = useState(false);

    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');

    const [selectedUserId, setSelectedUserId] = useState('');
    const [memberFirstName, setMemberFirstName] = useState('');
    const [memberLastName, setMemberLastName] = useState('');

    const [isEditChannelModalOpen, setIsEditChannelModalOpen] = useState(false);
    const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
    const [leaveChannelDialogOpen, setLeaveChannelDialogOpen] = useState(false);

    const effectiveChannelId = useMemo(() => {
        if (activeChannel && !activeChannel.is_direct) {
            try { localStorage.setItem('main_group_channel_id', activeChannel.id); } catch (e) {}
            return activeChannel.id;
        }
        try { return localStorage.getItem('main_group_channel_id') || activeChannel?.id || ''; } catch (e) { return activeChannel?.id || ''; }
    }, [activeChannel]);

    const myRealUserId = useMemo(() => {
        try {
            const activeUserStr = localStorage.getItem('activeUser');
            if (activeUserStr) {
                const parsed = JSON.parse(activeUserStr);
                if (parsed && (parsed.id || parsed.user_id)) return String(parsed.id || parsed.user_id);
            }
            return String(localStorage.getItem('userId') || '');
        } catch (e) { return ''; }
    }, []);

    useEffect(() => {
        if (open && effectiveChannelId) dispatch(fetchChannelMembers(effectiveChannelId));
    }, [open, effectiveChannelId, dispatch]);

    const myMemberData = useMemo(() => channelMembers.find(m => String(m.user_id || m.id || m.user?.id) === myRealUserId), [channelMembers, myRealUserId]);
    const isAdmin = useMemo(() => String(myMemberData?.role || '').toLowerCase() === 'admin', [myMemberData]);
    const otherMembers = useMemo(() => channelMembers.filter(m => String(m.user_id || m.id || m.user?.id) !== myRealUserId), [channelMembers, myRealUserId]);

    useEffect(() => {
        if (!open) {
            setSettingsView('menu');
            setProfileFirstName(''); setProfileLastName('');
            setSelectedUserId(''); setMemberFirstName(''); setMemberLastName('');
        }
    }, [open]);

    const handleGoToView = (view) => {
        if (view === 'editChannel') {
            setIsEditChannelModalOpen(true);
            return;
        }
        setSettingsView(view);
        if (view === 'editProfile') {
            setProfileFirstName(myMemberData?.first_name || myMemberData?.user?.first_name || '');
            setProfileLastName(myMemberData?.last_name || myMemberData?.user?.last_name || '');
        } else if (view === 'editMembers') {
            if (otherMembers.length > 0) {
                const firstOther = otherMembers[0];
                setSelectedUserId(String(firstOther.user_id || firstOther.id || firstOther.user?.id || ''));
                setMemberFirstName(firstOther.first_name || firstOther.user?.first_name || '');
                setMemberLastName(firstOther.last_name || firstOther.user?.last_name || '');
            } else {
                setSelectedUserId(''); setMemberFirstName(''); setMemberLastName('');
            }
        }
    };

    const handleMemberSelectChange = (event) => {
        const selectedId = String(event.target.value);
        setSelectedUserId(selectedId);
        const member = otherMembers.find(m => String(m.user_id || m.id || m.user?.id) === selectedId);
        if (member) {
            setMemberFirstName(member.first_name || member.user?.first_name || '');
            setMemberLastName(member.last_name || member.user?.last_name || '');
        }
    };

    const handleSave = async () => {
        if (!effectiveChannelId) return;
        setLoading(true);
        try {
            if (settingsView === 'editProfile') {
                await dispatch(updateChannelMember({ channelId: effectiveChannelId, targetUserId: myRealUserId, firstName: profileFirstName, lastName: profileLastName })).unwrap();
                onClose();
            } else if (settingsView === 'editMembers') {
                if (!selectedUserId) return;
                await dispatch(updateChannelMember({ channelId: effectiveChannelId, targetUserId: selectedUserId, firstName: memberFirstName, lastName: memberLastName })).unwrap();
                onClose();
            }
        } catch (err) { console.error("Güncelleme hatası:", err); } 
        finally { setLoading(false); }
    };

    const handleConfirmRemoveUser = async () => {
        if (!effectiveChannelId || !selectedUserId) return;
        setLoading(true);
        try {
            await dispatch(removeChannelMember({ channelId: effectiveChannelId, targetUserId: selectedUserId })).unwrap();
            setRemoveUserDialogOpen(false);
            setSettingsView('menu');
        } catch (err) { console.error("Silme hatası:", err); } 
        finally { setLoading(false); }
    };

    const handleConfirmLeaveChannel = async () => {
        if (!effectiveChannelId || !myRealUserId) return;
        setLoading(true);
        try {
            await dispatch(removeChannelMember({ channelId: effectiveChannelId, targetUserId: myRealUserId })).unwrap();
            setLeaveChannelDialogOpen(false);
            onClose();
        } catch (err) { console.error("Ayrılma hatası:", err); } 
        finally { setLoading(false); }
    };

    return (
        <>
            <Dialog open={open} onClose={!loading ? onClose : null} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {settingsView === 'menu' && 'Ayarlar'}
                    {settingsView === 'editProfile' && 'Profil Bilgilerini Düzenle'}
                    {settingsView === 'editMembers' && 'Üye Bilgilerini Düzenle'}
                </DialogTitle>

                <DialogContent dividers>
                    {!effectiveChannelId ? (
                        <p className="settings-warning-text" style={{ padding: '20px', textAlign: 'center' }}>
                            Lütfen ayarlara erişmek için önce bir ana gruba tıklayın.
                        </p>
                    ) : (
                        <div className="settings-modal-content">
                            {/* ANA MENÜ */}
                            {settingsView === 'menu' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    <Button variant="outlined" fullWidth onClick={() => handleGoToView('editProfile')} style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}>
                                        👤 Profilini Düzenle
                                    </Button>
                                    {isAdmin && (
                                        <>
                                            <Button variant="outlined" fullWidth onClick={() => handleGoToView('editMembers')} style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}>
                                                👥 Üye Bilgilerini Düzenle
                                            </Button>
                                            <Button variant="outlined" fullWidth onClick={() => handleGoToView('editChannel')} style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}>
                                                ⚙️ Kanal Ayarları
                                            </Button>
                                        </>
                                    )}
                                    <div style={{ marginTop: '5px', borderTop: '1px solid #E5E7EB', paddingTop: '15px' }}>
                                        <Button variant="outlined" color="error" fullWidth onClick={() => setLeaveChannelDialogOpen(true)} style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}>
                                            🚪 Kanaldan Ayrıl
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* PROFİL DÜZENLEME (Alt bileşene devredildi) */}
                            {settingsView === 'editProfile' && (
                                <ProfileSettings 
                                    firstName={profileFirstName} 
                                    lastName={profileLastName} 
                                    onFirstNameChange={setProfileFirstName} 
                                    onLastNameChange={setProfileLastName} 
                                    loading={loading} 
                                />
                            )}

                            {/* ÜYE YÖNETİMİ (Alt bileşene devredildi) */}
                            {settingsView === 'editMembers' && (
                                <MemberManagement 
                                    otherMembers={otherMembers}
                                    selectedUserId={selectedUserId}
                                    onMemberSelect={handleMemberSelectChange}
                                    memberFirstName={memberFirstName}
                                    onMemberFirstNameChange={setMemberFirstName}
                                    memberLastName={memberLastName}
                                    onMemberLastNameChange={setMemberLastName}
                                    onRemoveClick={() => setRemoveUserDialogOpen(true)}
                                    loading={loading}
                                />
                            )}
                        </div>
                    )}
                </DialogContent>

                <DialogActions>
                    {settingsView !== 'menu' ? (
                        <>
                            <Button onClick={() => setSettingsView('menu')} color="inherit" disabled={loading}>Geri</Button>
                            <Button variant="contained" color="primary" onClick={handleSave} disabled={loading || (settingsView === 'editMembers' && (!selectedUserId || otherMembers.length === 0))}>
                                {loading ? <CircularProgress size={20} color="inherit" /> : 'Kaydet'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} color="inherit">Kapat</Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* EVRENSEL ONAY MODALLARI */}
            <ConfirmDialog 
                open={removeUserDialogOpen}
                title="Kanaldan Çıkar"
                message={`${memberFirstName || 'Bu kullanıcıyı'} kanaldan çıkarmak istediğinize emin misiniz? Kullanıcı kanal geçmişine erişimini kaybedecektir.`}
                onConfirm={handleConfirmRemoveUser}
                onCancel={() => setRemoveUserDialogOpen(false)}
                confirmText="Evet, Kanaldan Çıkar"
                loading={loading}
            />

            <ConfirmDialog 
                open={leaveChannelDialogOpen}
                title="Kanaldan Ayrıl"
                message="Bu kanaldan ayrılmak istediğinize emin misiniz? Kanaldan ayrılırsanız, bir yönetici sizi tekrar ekleyene kadar mesaj geçmişine erişemezsiniz."
                onConfirm={handleConfirmLeaveChannel}
                onCancel={() => setLeaveChannelDialogOpen(false)}
                confirmText="Evet, Ayrıl"
                loading={loading}
            />

            <EditChannelModal open={isEditChannelModalOpen} onClose={() => setIsEditChannelModalOpen(false)} channel={activeChannel} />
        </>
    );
};

export default SettingsModal;
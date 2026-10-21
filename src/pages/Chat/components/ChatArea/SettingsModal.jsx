import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannelMembers, removeChannelMember, updateChannelMember } from '../../../../store/membersSlice';
import EditChannelModal from './EditChannelModal'; // Bağımsız modalımız import edildi
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    CircularProgress
} from '@mui/material';
import { MdPersonRemove } from "react-icons/md";

const SettingsModal = ({ open, onClose }) => {
    const dispatch = useDispatch();

    // Redux State'leri
    const activeChannel = useSelector((state) => state.chat.activeChannel);
    const channelMembers = useSelector((state) => state.members.list || []);

    // Modal İçi Görünüm State'i ('menu' | 'editProfile' | 'editMembers')
    const [settingsView, setSettingsView] = useState('menu');
    const [loading, setLoading] = useState(false);

    // Kendi Profilim İçin State'ler
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');

    // Diğer Üyeler (Admin) İçin State'ler
    const [selectedUserId, setSelectedUserId] = useState('');
    const [memberFirstName, setMemberFirstName] = useState('');
    const [memberLastName, setMemberLastName] = useState('');

    // --- YENİ: EditChannelModal'ın açılıp kapanma kontrolü ---
    const [isEditChannelModalOpen, setIsEditChannelModalOpen] = useState(false);

    //kullanıcıyı silme için onay modalı
    const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);

    // Kendi kendine kanaldan ayrılma onay modalı için state ===
    const [leaveChannelDialogOpen, setLeaveChannelDialogOpen] = useState(false);

    // Kanal ID Yönetimi (Sabit Ana Kanal Hafızası)
    const effectiveChannelId = useMemo(() => {
        if (activeChannel && !activeChannel.is_direct) {
            try {
                localStorage.setItem('main_group_channel_id', activeChannel.id);
            } catch (e) {}
            return activeChannel.id;
        }
        try {
            const savedMainId = localStorage.getItem('main_group_channel_id');
            if (savedMainId) return savedMainId;
        } catch (e) {}
        return activeChannel?.id || '';
    }, [activeChannel]);

    // Oturum Açan Kullanıcının Gerçek ID'sini Bulma
    const myRealUserId = useMemo(() => {
        try {
            const activeUserStr = localStorage.getItem('activeUser');
            if (activeUserStr) {
                const parsed = JSON.parse(activeUserStr);
                if (parsed && (parsed.id || parsed.user_id)) {
                    return String(parsed.id || parsed.user_id);
                }
            }
            const directUserId = localStorage.getItem('userId');
            if (directUserId) return String(directUserId);
        } catch (e) {}
        return '';
    }, []);

    // Modal Açıldığında Ana Kanalın Üyelerini Çek
    useEffect(() => {
        if (open && effectiveChannelId) {
            dispatch(fetchChannelMembers(effectiveChannelId));
        }
    }, [open, effectiveChannelId, dispatch]);

    // Oturum Açan Kullanıcının Kanaldaki Verisi
    const myMemberData = useMemo(() => {
        return channelMembers.find(m => String(m.user_id || m.id || m.user?.id) === myRealUserId);
    }, [channelMembers, myRealUserId]);

    // Rol Kontrolü (Sadece gerçek adminler görebilir)
    const isAdmin = useMemo(() => {
        const role = String(myMemberData?.role || '').toLowerCase();
        return role === 'admin';
    }, [myMemberData]);

    // Admin hariç diğer üyeler
    const otherMembers = useMemo(() => {
        return channelMembers.filter(m => String(m.user_id || m.id || m.user?.id) !== myRealUserId);
    }, [channelMembers, myRealUserId]);

    // Modal Kapandığında State'leri Sıfırlama
    useEffect(() => {
        if (!open) {
            setSettingsView('menu');
            setProfileFirstName('');
            setProfileLastName('');
            setSelectedUserId('');
            setMemberFirstName('');
            setMemberLastName('');
        }
    }, [open]);

    // Görünümlere Geçiş Yapıldığında Formları Doldurma
    const handleGoToView = (view) => {
        if (view === 'editChannel') {
            // Ayarlar modalını kapatmadan üstüne senin ayrı EditChannelModal'ını açıyoruz
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
                const firstId = String(firstOther.user_id || firstOther.id || firstOther.user?.id || '');
                setSelectedUserId(firstId);
                setMemberFirstName(firstOther.first_name || firstOther.user?.first_name || '');
                setMemberLastName(firstOther.last_name || firstOther.user?.last_name || '');
            } else {
                setSelectedUserId('');
                setMemberFirstName('');
                setMemberLastName('');
            }
        }
    };

    // Admin Üye Seçimini Değiştirdiğinde
    const handleMemberSelectChange = (event) => {
        const selectedId = String(event.target.value);
        setSelectedUserId(selectedId);

        const member = otherMembers.find(m => String(m.user_id || m.id || m.user?.id) === selectedId);
        if (member) {
            setMemberFirstName(member.first_name || member.user?.first_name || '');
            setMemberLastName(member.last_name || member.user?.last_name || '');
        }
    };

    // Kaydetme İşlemi (Profil veya Üye Güncelleme)
    const handleSave = async () => {
        if (!effectiveChannelId) return;
        setLoading(true);

        try {
            if (settingsView === 'editProfile') {
                await dispatch(updateChannelMember({
                    channelId: effectiveChannelId,
                    targetUserId: myRealUserId,
                    firstName: profileFirstName,
                    lastName: profileLastName
                })).unwrap();
                onClose();
            } else if (settingsView === 'editMembers') {
                if (!selectedUserId) return;
                await dispatch(updateChannelMember({
                    channelId: effectiveChannelId,
                    targetUserId: selectedUserId,
                    firstName: memberFirstName,
                    lastName: memberLastName
                })).unwrap();
                onClose();
            }
        } catch (err) {
            console.error("Güncelleme hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    //kullanıcıyı kanaldan çıkarma fonksiyonu
    const handleConfirmRemoveUser=async()=>{
        if(!effectiveChannelId || !selectedUserId) 
        {
            return;
        }
        setLoading(true);
        try{
            await dispatch(removeChannelMember({
                channelId:effectiveChannelId,
                targetUserId:selectedUserId
            })).unwrap();
            setRemoveUserDialogOpen(false);
            setSettingsView('menu');
        }
        catch(err){
            console.error("Kullanıcı silme hatası:",err);
        }
        finally{
            setLoading(false);
        }
    }

    //Kullanıcının Kendisinin Kanaldan Ayrılma Fonksiyonu
    const handleConfirmLeaveChannel = async () => {
        if (!effectiveChannelId || !myRealUserId) return;
        setLoading(true);
        try {
            await dispatch(removeChannelMember({ 
                channelId: effectiveChannelId, 
                targetUserId: myRealUserId // Hedef olarak KENDİ ID'mizi gönderiyoruz
            })).unwrap();
            
            setLeaveChannelDialogOpen(false);
            onClose(); // Ayrıldıktan sonra modalı tamamen kapat
        } catch (err) {
            console.error("Kanaldan ayrılma hatası:", err);
        } finally {
            setLoading(false);
        }
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

                            {/* 1. GÖRÜNÜM: ANA MENÜ */}
                            {settingsView === 'menu' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => handleGoToView('editProfile')}
                                        style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                    >
                                        👤 Profilini Düzenle
                                    </Button>

                                    {isAdmin && (
                                        <>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => handleGoToView('editMembers')}
                                                style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                            >
                                                👥 Üye Bilgilerini Düzenle
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => handleGoToView('editChannel')}
                                                style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                            >
                                                ⚙️ Kanal Ayarları
                                            </Button>
                                        </>
                                    )}
                                    <div style={{ marginTop: '5px', borderTop: '1px solid #E5E7EB', paddingTop: '15px' }}>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            fullWidth
                                            onClick={() => setLeaveChannelDialogOpen(true)}
                                            style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                        >
                                            🚪 Kanaldan Ayrıl
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* 2. GÖRÜNÜM: KENDİ PROFİLİNİ DÜZENLEME */}
                            {settingsView === 'editProfile' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    <TextField
                                        label="Adınız"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={profileFirstName}
                                        onChange={(e) => setProfileFirstName(e.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="Soyadınız"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={profileLastName}
                                        onChange={(e) => setProfileLastName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            {/* 3. GÖRÜNÜM: ADMİN İÇİN DİĞER ÜYELERİ DÜZENLEME */}
                            {settingsView === 'editMembers' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Yönetim Havuzu: <strong>Ortak Ana Kanal</strong>
                                    </Typography>

                                    {otherMembers.length === 0 ? (
                                        <p>Bu kanalda güncellenebilecek başka üye bulunamadı.</p>
                                    ) : (
                                        <>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="select-member-label">Güncellenecek Üye</InputLabel>
                                                <Select
                                                    labelId="select-member-label"
                                                    value={selectedUserId || ''}
                                                    label="Güncellenecek Üye"
                                                    onChange={handleMemberSelectChange}
                                                    disabled={loading}
                                                >
                                                    {otherMembers.map((member, index) => {
                                                        const memberUserId = String(member.user_id || member.id || member.user?.id || index);
                                                        const fName = member.first_name || member.user?.first_name || '';
                                                        const lName = member.last_name || member.user?.last_name || '';
                                                        const uName = member.username || member.user?.username || 'Kullanıcı';

                                                        return (
                                                            <MenuItem key={memberUserId} value={memberUserId}>
                                                                {fName || lName ? `${fName} ${lName}` : 'İsimsiz Üye'} ({uName})
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                label="Üye Adı"
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                value={memberFirstName}
                                                onChange={(e) => setMemberFirstName(e.target.value)}
                                                disabled={loading}
                                            />
                                            <TextField
                                                label="Üye Soyadı"
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                value={memberLastName}
                                                onChange={(e) => setMemberLastName(e.target.value)}
                                                disabled={loading}
                                            />
                                            <div style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                                                <Button 
                                                    variant="outlined" 
                                                    color="error" 
                                                    startIcon={<MdPersonRemove />}
                                                    onClick={() => setRemoveUserDialogOpen(true)}
                                                    disabled={loading || !selectedUserId}
                                                    sx={{ textTransform: 'none', width: '100%', justifyContent: 'center', borderRadius: '8px' }}
                                                >
                                                    Kullanıcıyı Kanaldan Çıkar
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>

                <DialogActions>
                    {settingsView !== 'menu' ? (
                        <>
                            <Button onClick={() => setSettingsView('menu')} color="inherit" disabled={loading}>Geri</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={
                                    loading ||
                                    (settingsView === 'editMembers' && (!selectedUserId || otherMembers.length === 0))
                                }
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : 'Kaydet'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} color="inherit">Kapat</Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* === YENİ: Kullanıcı Çıkarma Onay Modalı === */}
            <Dialog
                open={removeUserDialogOpen}
                onClose={() => !loading && setRemoveUserDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '12px', padding: '8px', minWidth: '320px' } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#DC2626' }}>
                    Kanaldan Çıkar
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-muted)' }}>
                        <strong style={{color: '#1F2937'}}>{memberFirstName || 'Bu kullanıcıyı'}</strong> kanaldan çıkarmak istediğinize emin misiniz? Kullanıcı kanal geçmişine erişimini kaybedecektir.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button onClick={() => setRemoveUserDialogOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleConfirmRemoveUser} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: '6px' }} disabled={loading}>
                        {loading ? <CircularProgress size={20} color="inherit" /> : 'Evet, Kanaldan Çıkar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* === YENİ: KENDİ KENDİNE KANALDAN AYRILMA ONAY MODALI === */}
            <Dialog
                open={leaveChannelDialogOpen}
                onClose={() => !loading && setLeaveChannelDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '12px', padding: '8px', minWidth: '320px' } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#DC2626' }}>
                    Kanaldan Ayrıl
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-muted)' }}>
                        Bu kanaldan ayrılmak istediğinize emin misiniz? Kanaldan ayrılırsanız, bir yönetici sizi tekrar ekleyene kadar mesaj geçmişine erişemezsiniz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button onClick={() => setLeaveChannelDialogOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleConfirmLeaveChannel} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: '6px' }} disabled={loading}>
                        {loading ? <CircularProgress size={20} color="inherit" /> : 'Evet, Ayrıl'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Ayrı olan EditChannelModal'ı SettingsModal içinde tetikliyoruz */}
            <EditChannelModal 
                open={isEditChannelModalOpen}
                onClose={() => setIsEditChannelModalOpen(false)}
                channel={activeChannel}
            />
        </>
    );
};

export default SettingsModal;
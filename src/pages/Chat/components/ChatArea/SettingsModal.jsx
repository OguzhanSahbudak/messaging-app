import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannelMembers, updateChannelMember } from '../../../../store/membersSlice';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography
} from '@mui/material';

const SettingsModal = ({ open, onClose }) => {
    const dispatch = useDispatch();

    // Redux State'leri
    const activeChannel = useSelector((state) => state.chat.activeChannel);
    const channelMembers = useSelector((state) => state.members.list || []);

    // Modal İçi Görünüm State'i ('menu' | 'editProfile' | 'editMembers')
    const [settingsView, setSettingsView] = useState('menu');

    // --- 1. KISIM: KENDİ PROFİLİM İÇİN AYRI STATE'LER ---
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');

    // --- 2. KISIM: DİĞER ÜYELER (ADMIN) İÇİN AYRI STATE'LER ---
    const [selectedUserId, setSelectedUserId] = useState('');
    const [memberFirstName, setMemberFirstName] = useState('');
    const [memberLastName, setMemberLastName] = useState('');

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

    // LocalStorage'daki activeUser objesinden gerçek ID'yi güvenle çekme[cite: 7]
    const myRealUserId = useMemo(() => {
        try {
            const activeUserStr = localStorage.getItem('activeUser');
            if (activeUserStr) {
                const parsed = JSON.parse(activeUserStr);
                if (parsed && (parsed.id || parsed.user_id)) {
                    return String(parsed.id || parsed.user_id);
                }
            }
            // Alternatif anahtarlar
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

    // Görünümlere Geçiş Yapıldığında İlgili Formu Doldurma
    const handleGoToView = (view) => {
        setSettingsView(view);

        if (view === 'editProfile') {
            // Sadece kendi profil form state'ini doldurur
            setProfileFirstName(myMemberData?.first_name || myMemberData?.user?.first_name || '');
            setProfileLastName(myMemberData?.last_name || myMemberData?.user?.last_name || '');
        } else if (view === 'editMembers') {
            // Sadece üye düzenleme form state'ini doldurur
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

    // Admin Select Listesinden Başka Üye Seçtiğinde
    const handleMemberSelectChange = (event) => {
        const selectedId = String(event.target.value);
        setSelectedUserId(selectedId);

        const member = otherMembers.find(m => String(m.user_id || m.id || m.user?.id) === selectedId);
        if (member) {
            setMemberFirstName(member.first_name || member.user?.first_name || '');
            setMemberLastName(member.last_name || member.user?.last_name || '');
        }
    };

    // Güncelleme İsteğini Gönder (Hangi görünümdeysek onun verisi gider)
    const handleSave = () => {
        if (!effectiveChannelId) return;

        const targetUserId = settingsView === 'editProfile' ? myRealUserId : selectedUserId;
        const currentFirstName = settingsView === 'editProfile' ? profileFirstName : memberFirstName;
        const currentLastName = settingsView === 'editProfile' ? profileLastName : memberLastName;

        if (!targetUserId) return;

        dispatch(updateChannelMember({
            channelId: effectiveChannelId,
            targetUserId: targetUserId,
            firstName: currentFirstName,
            lastName: currentLastName
        })).then((result) => {
            if (!result.error) {
                onClose();
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => handleGoToView('editMembers')}
                                        style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                    >
                                        👥 Üye Bilgilerini Düzenle
                                    </Button>
                                )}

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled
                                    style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                >
                                    ⚙️ Kanal Ayarları (Yakında)
                                </Button>
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
                                />
                                <TextField
                                    label="Soyadınız"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    value={profileLastName}
                                    onChange={(e) => setProfileLastName(e.target.value)}
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
                                        />
                                        <TextField
                                            label="Üye Soyadı"
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            value={memberLastName}
                                            onChange={(e) => setMemberLastName(e.target.value)}
                                        />
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
                        <Button onClick={() => setSettingsView('menu')} color="inherit">Geri</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            disabled={
                                (settingsView === 'editMembers' && (!selectedUserId || otherMembers.length === 0))
                            }
                        >
                            Kaydet
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose} color="inherit">Kapat</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SettingsModal;
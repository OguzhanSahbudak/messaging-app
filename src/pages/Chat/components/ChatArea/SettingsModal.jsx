import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyDms } from '../../../../store/chatSlice';
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
    InputLabel
} from '@mui/material';

const SettingsModal = ({ open, onClose }) => {
    const dispatch = useDispatch();

    // Redux State'leri
    const activeChannel = useSelector((state) => state.chat.activeChannel);
    const dmList = useSelector((state) => state.chat.dmList);
    const channelMembers = useSelector((state) => state.members.list);

    // Modal İçi Görünüm ve Form State'leri
    const [settingsView, setSettingsView] = useState('menu'); // 'menu' | 'editProfile' | 'editMembers'
    const [selectedUserId, setSelectedUserId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Home veya DMs sekmesinden bağımsız güvenli kanal ID'si
    const effectiveChannelId = activeChannel?.id || dmList?.[0]?.id;

    // Oturum Açan Kullanıcının Gerçek ID'sini Bulma
    const myRealUserId = useMemo(() => {
        try {
            const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('activeUser');
            if (userStr) {
                const parsed = JSON.parse(userStr);
                if (parsed && (parsed.id || parsed.user_id)) return String(parsed.id || parsed.user_id);
            }
        } catch (e) {}

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded) {
                    return String(decoded.id || decoded.user_id || decoded.sub || '');
                }
            }
        } catch (e) {}
        return '';
    }, []);

    // Gerekli Kanal ve Üye Bilgilerini Çek
    useEffect(() => {
        if (open && !effectiveChannelId) {
            dispatch(fetchMyDms());
        }
    }, [open, effectiveChannelId, dispatch]);

    useEffect(() => {
        if (open && effectiveChannelId) {
            dispatch(fetchChannelMembers(effectiveChannelId));
        }
    }, [open, effectiveChannelId, dispatch]);

    // Kullanıcının Kanaldaki Verisi ve Rolü
    const myMemberData = channelMembers.find(m => String(m.user_id || m.id || m.user?.id) === myRealUserId);
    const isAdmin = String(myMemberData?.role).toLowerCase() === 'admin';

    // Admin'in üye düzenleme ekranında KENDİSİ HARİÇ diğer üyeler listelenir
    const otherMembers = useMemo(() => {
        return channelMembers.filter(m => String(m.user_id || m.id || m.user?.id) !== myRealUserId);
    }, [channelMembers, myRealUserId]);

    // Modal Kapandığında State Sıfırlama
    useEffect(() => {
        if (!open) {
            setSettingsView('menu');
            setSelectedUserId('');
            setFirstName('');
            setLastName('');
        }
    }, [open]);

    // Görünümlere Geçiş Yapıldığında Formları Doldurma
    const handleGoToView = (view) => {
        setSettingsView(view);

        if (view === 'editProfile') {
            // Kendi Profilini Düzenle -> Giriş Yapan Kullanıcının Bilgileri Yüklenir
            setFirstName(myMemberData?.first_name || myMemberData?.user?.first_name || '');
            setLastName(myMemberData?.last_name || myMemberData?.user?.last_name || '');
        } else if (view === 'editMembers') {
            // Üye Bilgilerini Düzenle -> Kendisi Hariç İlk Üyenin Bilgileri Yüklenir
            if (otherMembers.length > 0) {
                const firstOther = otherMembers[0];
                const firstId = String(firstOther.user_id || firstOther.id || firstOther.user?.id || '');
                setSelectedUserId(firstId);
                setFirstName(firstOther.first_name || firstOther.user?.first_name || '');
                setLastName(firstOther.last_name || firstOther.user?.last_name || '');
            } else {
                setSelectedUserId('');
                setFirstName('');
                setLastName('');
            }
        }
    };

    // Admin Açılır Listeden Başka Bir Üye Seçtiğinde
    const handleMemberSelectChange = (event) => {
        const selectedId = String(event.target.value);
        setSelectedUserId(selectedId);

        const member = otherMembers.find(m => String(m.user_id || m.id || m.user?.id) === selectedId);
        if (member) {
            setFirstName(member.first_name || member.user?.first_name || '');
            setLastName(member.last_name || member.user?.last_name || '');
        }
    };

    // Güncelleme İsteğini Gönder
    const handleSave = () => {
        if (!effectiveChannelId) return;

        // Ekrana göre hedef ID belirlenir:
        // 'editProfile' -> Kendi ID'si (myRealUserId)
        // 'editMembers' -> Seçilen Üyenin ID'si (selectedUserId)
        const targetUserId = settingsView === 'editProfile' ? myRealUserId : selectedUserId;

        if (!targetUserId) return;

        dispatch(updateChannelMember({
            channelId: effectiveChannelId,
            targetUserId: targetUserId,
            firstName,
            lastName
        })).then((result) => {
            if (!result.error) {
                onClose(); // Başarılı ise modalı kapat
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {settingsView === 'menu' && 'Ayarlar'}
                {settingsView === 'editProfile' && 'Profil Bilgilerini Düzenle'}
                {settingsView === 'editMembers' && 'Kanal Üye Bilgilerini Düzenle'}
            </DialogTitle>

            <DialogContent dividers>
                {!effectiveChannelId ? (
                    <p className="settings-warning-text">
                        Ayarları yüklemek için kanal bilgisi bekleniyor...
                    </p>
                ) : (
                    <div className="settings-modal-content">

                        {/* 1. GÖRÜNÜM: ANA MENÜ */}
                        {settingsView === 'menu' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                {/* HERKES İÇİN: Kendi Profilini Düzenle */}
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => handleGoToView('editProfile')}
                                    style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                >
                                    👤 Profilini Düzenle
                                </Button>

                                {/* SADECE ADMİN İÇİN: Üye Bilgilerini Düzenle */}
                                {isAdmin && (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => handleGoToView('editMembers')}
                                        style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                    >
                                        👥 Üye Bilgilerini Düzenle (Admin)
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
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                <TextField
                                    label="Soyadınız"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        )}

                        {/* 3. GÖRÜNÜM: ADMİN İÇİN DİĞER ÜYELERİ DÜZENLEME */}
                        {settingsView === 'editMembers' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                {otherMembers.length === 0 ? (
                                    <p>Kanalda güncellenebilecek başka üye bulunamadı.</p>
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
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                        <TextField
                                            label="Üye Soyadı"
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
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
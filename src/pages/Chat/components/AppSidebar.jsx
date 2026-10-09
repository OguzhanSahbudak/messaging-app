import React, { useEffect, useState, useMemo } from 'react';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, fetchMyDms } from '../../../store/chatSlice';
import { fetchChannelMembers, updateChannelMember } from '../../../store/membersSlice';
import { Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import '../AppSidebar.css';

const AppSidebar = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector((state) => state.chat.activeTab);
    const activeChannel = useSelector((state) => state.chat.activeChannel);
    const dmList = useSelector((state) => state.chat.dmList);
    const channelMembers = useSelector((state) => state.members.list);

    const { unreadCounts } = useSelector((state) => state.notification);
    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    // Modal State'leri
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsView, setSettingsView] = useState('menu'); 
    
    // Form State'leri
    const [selectedUserId, setSelectedUserId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    
    // KRİTİK: Inputların yazarken ezilmemesi için kilit
    const [initialLoaded, setInitialLoaded] = useState(false); 

    // Home veya DMs sekmesinden bağımsız güvenli kanal ID'si
    const effectiveChannelId = activeChannel?.id || dmList?.[0]?.id;

    // 1. Giriş Yapan Kullanıcının Gerçek ID'sini Bul
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

    // 2. Eksik Verileri Çek
    useEffect(() => {
        if (isSettingsOpen && !effectiveChannelId) {
            dispatch(fetchMyDms());
        }
    }, [isSettingsOpen, effectiveChannelId, dispatch]);

    useEffect(() => {
        if (isSettingsOpen && effectiveChannelId) {
            dispatch(fetchChannelMembers(effectiveChannelId));
        }
    }, [isSettingsOpen, effectiveChannelId, dispatch]);

    // 3. BACKEND UYUMLU ROL KONTROLÜ (Global değil, Kanala özel rol!)
    const myMemberData = channelMembers.find(m => String(m.user_id || m.id || m.user?.id) === myRealUserId);
    const isAdmin = String(myMemberData?.role).toLowerCase() === 'admin';

    // 4. Modal İlk Açıldığında Formu Doldur (Yalnızca 1 kez çalışır)
    useEffect(() => {
        if (isSettingsOpen && channelMembers.length > 0 && !initialLoaded) {
            // İster admin olsun ister normal kullanıcı, başlangıçta kendi bilgilerini gösteririz
            setSelectedUserId(myRealUserId);
            setFirstName(myMemberData?.first_name || myMemberData?.user?.first_name || '');
            setLastName(myMemberData?.last_name || myMemberData?.user?.last_name || '');
            
            setInitialLoaded(true); // Kilidi kapat, böylece harf yazdığında bu useEffect bir daha çalışıp yazıyı silmez!
        } else if (!isSettingsOpen) {
            // Modal kapanınca her şeyi sıfırla
            setSelectedUserId('');
            setFirstName('');
            setLastName('');
            setSettingsView('menu');
            setInitialLoaded(false);
        }
    }, [isSettingsOpen, channelMembers, initialLoaded, myRealUserId, myMemberData]);

    // 5. Admin Listeden Başka Birini Seçtiğinde (Sadece admin tetikleyebilir)
    const handleUserChange = (event) => {
        if (!isAdmin) return;

        const selectedId = String(event.target.value);
        setSelectedUserId(selectedId);

        const member = channelMembers.find(m => String(m.user_id || m.id || m.user?.id) === selectedId);
        if (member) {
            setFirstName(member.first_name || member.user?.first_name || '');
            setLastName(member.last_name || member.user?.last_name || '');
        }
    };

    const handleTabClick = (tabName) => {
        dispatch(setActiveTab(tabName));
        if (tabName === 'dms') {
            dispatch(fetchMyDms());
        }
    };

    // 6. Backend'e Kayıt İsteği At
    const handleSaveSettings = () => {
        // Adminse listedeki kişiyi, değilse kendi ID'sini yolla (Backend ile uyumlu)
        const targetIdToUpdate = isAdmin ? selectedUserId : myRealUserId;

        if (!effectiveChannelId || !targetIdToUpdate) return;

        dispatch(updateChannelMember({
            channelId: effectiveChannelId,
            targetUserId: targetIdToUpdate,
            firstName,
            lastName
        })).then((result) => {
            if (!result.error) {
                setIsSettingsOpen(false);
            }
        });
    };

    return (
        <>
            <div className="app-sidebar">
                <div className="app-logo-wrapper">
                    <ForumRoundedIcon fontSize="medium" />
                </div>

                <button className={`app-icon-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleTabClick('home')} >
                    <GridViewRoundedIcon fontSize="small" />
                    <span>Home</span>
                </button>

                <button className={`app-icon-btn ${activeTab === 'dms' ? 'active' : ''}`} onClick={() => handleTabClick('dms')} >
                    <Badge badgeContent={totalUnread} color="error" max={99}>
                        <ForumRoundedIcon fontSize="small" />
                    </Badge>
                    <span>DMs</span>
                </button>

                <button className="app-icon-btn">
                    <NotificationsRoundedIcon fontSize="small" />
                    <span>Activity</span>
                </button>

                <button
                    className="app-icon-btn"
                    onClick={() => setIsSettingsOpen(true)}
                    style={{ marginTop: 'auto', marginBottom: '20px' }}
                >
                    <SettingsRoundedIcon fontSize="small" />
                    <span>Settings</span>
                </button>
            </div>

            <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {settingsView === 'menu' ? 'Kanal ve Profil Ayarları' : 'Üye Bilgilerini Düzenle'}
                </DialogTitle>
                
                <DialogContent dividers>
                    {!effectiveChannelId ? (
                        <p className="settings-warning-text">
                            Ayarları yüklemek için kanal bilgisi bekleniyor...
                        </p>
                    ) : (
                        <div className="settings-modal-content">
                            
                            {/* ANA MENÜ */}
                            {settingsView === 'menu' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setSettingsView('editMember')}
                                        style={{ justifyContent: 'flex-start', textTransform: 'none', padding: '10px 15px', fontSize: '16px' }}
                                    >
                                        👥 Üye Bilgilerini Düzenle
                                    </Button>

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

                            {/* DÜZENLEME FORMU */}
                            {settingsView === 'editMember' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
                                    
                                    {/* YALNIZCA KANAL ADMİNİ İSE GÖRÜNÜR */}
                                    {isAdmin && (
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="select-user-label">Güncellenecek Kişi</InputLabel>
                                            <Select
                                                labelId="select-user-label"
                                                value={selectedUserId || ''}
                                                label="Güncellenecek Kişi"
                                                onChange={handleUserChange}
                                            >
                                                {channelMembers.map((member, index) => {
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
                                    )}

                                    {/* Ad ve Soyad Inputları */}
                                    <TextField
                                        label="Ad"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                    <TextField
                                        label="Soyad"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
                
                <DialogActions>
                    {settingsView === 'editMember' ? (
                        <>
                            <Button onClick={() => setSettingsView('menu')} color="inherit">Geri</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSaveSettings}
                                disabled={!effectiveChannelId || (!isAdmin && !myRealUserId) || (isAdmin && !selectedUserId)}
                            >
                                Kaydet
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsSettingsOpen(false)} color="inherit">Kapat</Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AppSidebar;
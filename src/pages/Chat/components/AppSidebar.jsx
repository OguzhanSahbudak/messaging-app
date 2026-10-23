import React, { useState } from 'react';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, fetchMyDms } from '../../../store/chatSlice';
import { Badge } from '@mui/material';
import SettingsModal from './ChatArea/SettingsModal';
import '../Sidebar.css';
import Favicon from '../../../assets/Favicon.jpeg'

const AppSidebar = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector((state) => state.chat.activeTab);
    
    // === YENİ: DMs listesini Redux'tan alıyoruz ===
    const dmList = useSelector((state) => state.chat.dmList);

    const { unreadCounts } = useSelector((state) => state.notification);
    // Toplam okunmamış mesaj sayısını hesaplıyoruz
    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleTabClick = (tabName) => {
        dispatch(setActiveTab(tabName));
        
        if (tabName === 'dms') {
            // === OPTIMISTIC UI KORUMASI: Eğer DMs listesi boşsa API'ye git, doluysa backend'i yorma! ===
            if (!dmList || dmList.length === 0) {
                dispatch(fetchMyDms());
            }
        }
    };

    return (
        <>
            <div className="app-sidebar">
                <div className="app-logo-wrapper">
                    <img src={Favicon} style={{ 
                        width: '55px', 
                        height: '55px', 
                        borderRadius: '12px', 
                        objectFit: 'cover' 
                    }} alt="App Logo" />
                </div>

                <button
                    className={`app-icon-btn ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => handleTabClick('home')}
                >
                    <GridViewRoundedIcon fontSize="small" />
                    <span>Home</span>
                </button>

                <button
                    className={`app-icon-btn ${activeTab === 'dms' ? 'active' : ''}`}
                    onClick={() => handleTabClick('dms')}
                >
                    <Badge badgeContent={totalUnread} color="error" max={99}
                        sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }} 
                    >
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

            <SettingsModal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};

export default AppSidebar;
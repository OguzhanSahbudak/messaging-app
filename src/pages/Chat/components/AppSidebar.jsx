import React, { useState } from 'react';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, fetchMyDms } from '../../../store/chatSlice';
import { Badge } from '@mui/material';
import SettingsModal from './ChatArea/SettingsModal'; // Yeni oluşturduğumuz modalı import ettik
import '../AppSidebar.css';

const AppSidebar = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector((state) => state.chat.activeTab);

    const { unreadCounts } = useSelector((state) => state.notification);
    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    // Settings Modalının Görünürlük State'i
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleTabClick = (tabName) => {
        dispatch(setActiveTab(tabName));
        if (tabName === 'dms') {
            dispatch(fetchMyDms());
        }
    };

    return (
        <>
            <div className="app-sidebar">
                <div className="app-logo-wrapper">
                    <ForumRoundedIcon fontSize="medium" />
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

            {/* Ayarlar Modalı (Ayrı Bileşen) */}
            <SettingsModal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};

export default AppSidebar;
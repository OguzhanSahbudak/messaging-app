import React from 'react';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, fetchMyDms } from '../../../store/chatSlice';
import { Badge } from '@mui/material';


const AppSidebar = () => {

    const dispatch=useDispatch();
    const activeTab=useSelector((state) => state.chat.activeTab);

   // 2. TÜM OKUNMAMIŞ MESAJ SAYILARINI TOPLUYORUZ
    const { unreadCounts } = useSelector((state) => state.notification);
    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    const handleTabClick=(tabName)=>{
        dispatch(setActiveTab(tabName));
        if(tabName==='dms')
        {
            dispatch(fetchMyDms()); // DMs sekmesine geçilince sohbetleri çek
        }
    }

  return (
    <div className="app-sidebar">
            <div className="app-logo-wrapper">
                <ForumRoundedIcon fontSize="medium" />
            </div>
            
            <button className={`app-icon-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={()=> handleTabClick('home')} >
                <GridViewRoundedIcon fontSize="small" />
                <span>Home</span>
            </button>
            
            <button className={`app-icon-btn ${activeTab === 'dms' ? 'active' : ''}`}  onClick={() => handleTabClick('dms')} >
                <Badge badgeContent={totalUnread} color="error" max={99}>
                    <ForumRoundedIcon fontSize="small" />
                </Badge>
                <span>DMs</span>
            </button>

            <button className="app-icon-btn">
                <NotificationsRoundedIcon fontSize="small" />
                <span>Activity</span>
            </button>
        </div>
  )
}

export default AppSidebar
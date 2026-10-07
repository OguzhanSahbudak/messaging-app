import React, { useState } from 'react';
import AppSidebar from './components/AppSidebar';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import ChatArea from './components/ChatArea/ChatArea';
import './ChatLayout.css';
import { useParams } from 'react-router-dom';

const ChatLayout = () => {
   const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
   const {channelId}=useParams();
    
    

    return (
        <div className="chat-layout-container">
            <AppSidebar />
            
            <WorkspaceSidebar 
                isOpen={isMobileSidebarOpen}
                channelId={channelId}
            />
            
            <ChatArea 
                
                toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
            />
        </div>
    );
}

export default ChatLayout
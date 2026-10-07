import { useState,useEffect } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import SignIn from './pages/SignIn/SignIn'
import AcceptInvite from './pages/AcceptInvite/AcceptInvite'
import { Route, Routes,Navigate } from 'react-router-dom'
import Verify from './pages/Verify/Verify'
import Channel from './pages/Channel/Channel'
import ChatLayout from './pages/Chat/ChatLayout'
import { useDispatch, useSelector } from 'react-redux'
import { Snackbar, Alert } from '@mui/material';
import { hideNotification } from './store/notificationSlice'
import {useGlobalWebSocket} from './hooks/useGlobalWebSocket'



function App() {

  const dispatch=useDispatch();

  useGlobalWebSocket();

  // 1. Redux'tan bildirim durumunu çekiyoruz
  const {appNotification} =useSelector((state) => state.notification);

  // 2. Sayfa ilk açıldığında tarayıcı bildirim izni iste (Sekme arka plandayken gelen mesajlar için)
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, []);

    // 3. Sağ alt bildirim kapandığında Redux state'ini sıfırla
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return; // Yanlışlıkla dışarı tıklayınca hemen kapanmasın
        dispatch(hideNotification());
    };
 

  return (
    <>
      <Routes>
        <Route path='/' element={<Navigate to="/signin" replace/>}/>

        <Route path='/verify' element={<Verify/>}/>

        <Route path='/signin' element={<SignIn/>}/>

       <Route path='/channel' element={<Channel/>}/>
        
        <Route path='/invite' element={<AcceptInvite/>}/>
        <Route path='/accept-invite' element={<AcceptInvite/>}/>

        <Route path='/chat/:channelId' element={<ChatLayout/>}/>

      </Routes>

      {/* --- SAĞ ALT KÖŞE BİLDİRİM BİLEŞENİ --- */}
      {/* Routes'ın hemen altına koyduk ki tüm sayfalarda üst katman (overlay) olarak çalışsın */}
      <Snackbar
        open={appNotification.open}
        autoHideDuration={4000} // 4 saniye sonra otomatik kapanır
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Sağ alt köşe
      >
        <Alert
          onClose={handleCloseNotification}
          severity={appNotification.severity || "info"}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          <strong>{appNotification.senderName}</strong>: {appNotification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default App

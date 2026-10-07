import React, { useEffect, useState , useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import api from '../../api/axiosInstance';
import './AcceptInvite.css';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const isExecutedRef = useRef(false);

  const handleAcceptInvite = async () => {

    // Eğer istek zaten atıldıysa veya işlem yapılıyorsa tekrar çalıştırma
    if (isExecutedRef.current || status === 'loading') return;

    const token = searchParams.get('token');
    
    if (!token) {
        setStatus('error');
        setErrorMessage('Geçersiz Davet Linki. Token bulunamadı.');
        return;
    }
    isExecutedRef.current = true; // İstek kilitlendi
    setStatus('loading');

    try {
       
        const response = await api.post('channels/accept-invite', {
            token: token
        });
        
        if (response.data && (response.data.token || response.data.access_token)) {
            localStorage.setItem('token', response.data.token || response.data.access_token);
        }
        
        setStatus('success');
        
        setTimeout(() => {
            navigate('/channel');
        }, 3000);
        
    } catch (error) {
        console.error("Davet kabul Detaylı Hata:", error.response?.data || error.message);
        setStatus('error');
        const serverMessage = error.response?.data?.detail || 'Geçersiz veya daha önce kullanılmış davet linki.';
        setErrorMessage(serverMessage);
    }
};

   return (
        <div className='accept-invite-wrapper'>
            
            {/* Sayfa ilk açıldığında doğrudan istek atma, kullanıcıya buton göster */}
            {status === 'idle' && (
                <div className='accept-invite-status-box'>
                    <Typography variant='h5' gutterBottom sx={{ fontWeight: 'bold' }}>
                        Kanala Davet Edildiniz!
                    </Typography>
                    <Typography variant='body1' className='accept-invite-subtext' sx={{ mb: 3 }}>
                        Daveti onaylayıp kanala katılmak için lütfen aşağıdaki butona tıklayın.
                    </Typography>
                    <Button 
                        variant='contained' 
                        size='large'
                        className='accept-invite-btn' 
                        onClick={handleAcceptInvite}
                        color='primary'
                        disabled={status === 'loading' || status === 'success'}
                    >
                        Daveti Kabul Et
                    </Button>
                </div>
            )}

            {status === 'loading' && (
                <div className='accept-invite-status-box'>
                    <CircularProgress size={60} className='accept-invite-spinner' sx={{ mb: 2 }} />
                    <Typography variant='h6' className='accept-invite-loading-text'>
                        Davetiniz onaylanıyor, lütfen bekleyin...
                    </Typography>
                </div>
            )}

            {status === 'success' && (
                <div className='accept-invite-status-box'>
                    <Alert severity='success' className='accept-invite-alert' sx={{ mb: 2 }}>
                        Kanala başarıyla katıldınız ve sisteme giriş yapıldı!
                    </Alert>
                    <Typography variant='body1' className='accept-invite-subtext' sx={{ mb: 2 }}>
                        Sohbet ekranına yönlendiriliyorsunuz...
                    </Typography>
                    <Button variant='contained' className='accept-invite-btn' onClick={() => navigate('/channel')}>
                        Hemen Git
                    </Button>
                </div>
            )}

            {status === 'error' && (
                <div className='accept-invite-status-box'>
                    <Alert severity='error' className='accept-invite-alert' sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                    <Button variant='outlined' className='accept-invite-btn' onClick={() => navigate('/signin')}>
                        Giriş Sayfasına Dön
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AcceptInvite
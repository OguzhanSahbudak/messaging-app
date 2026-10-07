import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axiosInstance'

const Verify = () => {
    const [searchParams]=useSearchParams();
    const [statusMessage , setStatusMessage]=useState('Giriş yapılıyor, lütfen bekleyin...');
    const navigate =useNavigate();
   
    useEffect(()=>{
        const verifyToken =async()=>{
          const urlToken=searchParams.get('token');
          if(!urlToken)
          {
            navigate('/signin');
            return;
          }
          try{
            const response = await api.post(`auth/verify-magic-link`,{
              token:urlToken
            });
            console.log("BACKEND'DEN GELEN TAM VERİ:", response.data);
            localStorage.setItem('userId', response.data.user_id); // DİKKAT: Backend "user_id" yerine "id" veya "user.id" dönüyorsa burayı ona göre düzeltmelisin.
           const realJwtToken = response.data.token || response.data.access_token;
           const refreshToken=response.data.refresh_token;
            localStorage.setItem('token',realJwtToken);
            if(refreshToken)
            {
              localStorage.setItem('refreshToken',refreshToken);
            }

            navigate('/channel');
      
          }
          catch(err){
            console.log('doğrulama hatası',err);
            setStatusMessage('Bağlantı geçersiz veya süresi dolmuş. Yönlendiriliyorsunuz...');
            setTimeout(()=>{
              navigate('/signin')
            },3000)
          }
        }
        verifyToken();
    },[searchParams,navigate])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif' 
    }}>
      <h2>{statusMessage}</h2>
    </div>
  )
}

export default Verify
import React, { useState } from 'react'
import './SignIn.css'
import { useNavigate } from 'react-router-dom';
import {  HiChatBubbleLeftRight, HiEnvelope, HiPaperAirplane } from "react-icons/hi2";
import axios from 'axios';
import { TextField } from '@mui/material';
import api from '../../api/axiosInstance'

const SignIn = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const handleSendLink = async () => {
    setIsLoading(true);
    setError('');
    try{
      await api.post(`auth/request-magic-link`,{
          email:email
      });
    }
    catch(err){
        console.log("Hata:",err);
        setError('Mail gönderilmedi. lütfen tekrar deneyin')

    }
    finally{
      setIsLoading(false)
    }

    setStep(2);
  };


  return (
    <div className="signin-wrapper">
      <div className="signin-card">

        

        {/* Her aşamada değişen dinamik başlık alanı */}
        <div className="signin-header">
          <div className="icon-badge">
            {step === 0 && <HiChatBubbleLeftRight className="header-icon" />}
            {step === 1 && <HiEnvelope className="header-icon" />}
            {step === 2 && <HiPaperAirplane className="header-icon" />}
          </div>
          <h2 className="signin-title">Hoş Geldiniz</h2>
          <p className="signin-subtitle">
            {step === 0 && "Uygulamaya giriş yapmak için devam edin"}
            {step === 1 && " e-posta adresinizi girin"}
            {step === 2 && `${email} adresine gönderilen bağlantıya tıklayın`}
          </p>
        </div>

        {/* 1. Aşama: Başlangıç */}
        {step === 0 && (
          <div className="fade-in-step">
            <button className="signin-btn" onClick={() => setStep(1)}>
              E-posta ile Giriş Yap
            </button>
          </div>
        )}

        {/* 2. Aşama: Email Formu */}
        {step === 1 && (
        
          <div className="fade-in-step">
            
            <div className="input-group">
              <TextField
                label="E-Posta Adresi"
                variant='outlined'
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='signin-input'
              />
              {/* <label className="input-label">E-posta Adresi</label>
              <input
                type="email"
                className="signin-input"
                placeholder="ahmet@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                disabled={isLoading}
              /> */}
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}

            {/* email state'i boşsa buton tıklanamaz olur */}
            <button
              className="signin-btn"
              onClick={handleSendLink}
              disabled={!email.includes('@') || isLoading}
            >
              {isLoading ? 'Gönderiliyor' :'Gönder'}
            </button>

            <button className="back-btn" onClick={() => setStep(0)} disabled={isLoading}>
              Vazgeç
            </button>
          </div>
        )}

        
        {step === 2 && (
          <div className="fade-in-step">
            <div style={{ margin: '20px 0', fontSize: '48px' }}>✉️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Mailinizi Kontrol Edin</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
              <strong>{email}</strong> adresine bir giriş bağlantısı gönderdik. Lütfen gelen kutunuzu kontrol edip linke tıklayın.
            </p>

            <button className="back-btn" onClick={() => setStep(1)} style={{ marginTop: '24px' }}>
              Farklı bir e-posta kullan
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SignIn
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from '@mui/material';
import api from '../../../api/axiosInstance';

const InviteModal = ({ open, onClose, channelId, onSuccess, onError }) => {
    const [email, setEmail] = useState('');
    const [firstName , setFirstName]=useState('');
    const [lastName , setLastName]=useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleSendInvite = async () => {
        if (!email || !firstName || !lastName) return;
        if (!email) return;
        setIsInviting(true);
        try {
            await api.post(`channels/${channelId}/invite`, { email:email , first_name:firstName , last_name:lastName });
           onSuccess(`${firstName} ${lastName} (${email}) adresine davet linki gönderildi!`);
            setEmail('');
            setFirstName('');
            setLastName('');
            onClose();
        } catch (error) {
            console.error("Davet hatası:", error);
            onError('Davet gönderilemedi. Admin yetkiniz olduğundan emin olun.');
        } finally {
            setIsInviting(false);
        }
    };

  return (
   <Dialog open={open} onClose={onClose} disableRestoreFocus>
            <DialogTitle>Kanala Davet Et</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Kullanıcıyı bu kanala davet etmek için e-posta adresini girin.
                </DialogContentText>
                <TextField
                    autoFocus 
                    margin='dense' 
                    label="Ad" 
                    type='text'
                    fullWidth 
                    variant='outlined' 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    sx={{ mb: 1 }}
                />
                <TextField
                    margin='dense' 
                    label="Soyad" 
                    type='text'
                    fullWidth 
                    variant='outlined' 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    sx={{ mb: 1 }}
                />
                <TextField
                    autoFocus margin='dense' label="E-posta Adresi" type='email'
                    fullWidth variant='outlined' value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isInviting}>İptal</Button>
                <Button onClick={handleSendInvite} variant='contained' disabled={!email || !firstName || !lastName || isInviting}>
                    {isInviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                </Button>
            </DialogActions>
        </Dialog>
  )
}

export default InviteModal
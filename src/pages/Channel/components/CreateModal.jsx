import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from '@mui/material';
import api from '../../../api/axiosInstance';

const CreateModal = ({open, onClose, onSuccess, onError}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post('channels/', {
                name: name.trim(),
                description: description.trim()
            });
            onSuccess(response.data, 'Kanal başarıyla oluşturuldu!');
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error("Kanal oluşturulmadı", error);
            onError('Kanal oluşturulamadı. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
   <Dialog open={open} onClose={onClose}>
            <DialogTitle>Yeni Kanal Oluştur</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Ekibinizle iletişim kurmak için yeni bir kanal tanımlayın.
                </DialogContentText>
                <form onSubmit={handleSubmit} id="modal-create-channel-form">
                    <TextField
                        autoFocus margin='dense' label="Kanal Adı" variant="outlined"
                        fullWidth required value={name}
                        onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }}
                    />
                    <TextField
                        margin='dense' label="Kanal Açıklaması" variant="outlined"
                        fullWidth required multiline rows={2} value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isSubmitting}>İptal</Button>
                <Button 
                    type="submit" form="modal-create-channel-form" variant='contained' 
                    disabled={!name.trim() || !description.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </Button>
            </DialogActions>
        </Dialog>
  )
}

export default CreateModal
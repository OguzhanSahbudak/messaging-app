import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import api from '../../../api/axiosInstance';

const DeleteModal = ({ open, onClose, channelId, onSuccess, onError }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!channelId) return;
        setIsDeleting(true);
        try {
            await api.delete(`channels/${channelId}`);
            onSuccess(channelId, 'Kanal başarıyla silindi.');
            onClose();
        } catch (error) {
            console.error("Silme hatası:", error);
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                onError('Bu kanalı silmek için yönetici (admin) yetkiniz bulunmamaktadır.');
            } else {
                onError('Kanal silinemedi. Lütfen tekrar deneyin.');
            }
        } finally {
            setIsDeleting(false);
        }
    };
  return (
    <Dialog open={open} onClose={onClose}>
            <DialogTitle sx={{ color: 'error.main' }}>Kanalı Sil</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Bu kanalı silmek istediğinize emin misiniz? Bu işlem kalıcıdır ve kanaldaki tüm veriler silinir.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isDeleting}>İptal</Button>
                <Button onClick={handleConfirmDelete} color='error' variant='contained' disabled={isDeleting}>
                    {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                </Button>
            </DialogActions>
        </Dialog>
  )
}

export default DeleteModal
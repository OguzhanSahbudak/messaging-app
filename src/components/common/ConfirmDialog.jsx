import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    Button, 
    CircularProgress 
} from '@mui/material';

// === EVRENSEL ONAY MODALI ===
// Neden Yaptık?: Projedeki tüm "Silmeye emin misin?", "Çıkış yap?", "Kanaldan ayrıl?" 
// gibi soruları tek bir yerden yönetmek için. Dosya şişmesini önler.
const ConfirmDialog = ({ 
    open, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Evet", 
    cancelText = "İptal",
    confirmColor = "error",
    loading = false 
}) => {
    return (
        <Dialog
            open={open}
            onClose={!loading ? onCancel : null}
            PaperProps={{ sx: { borderRadius: '12px', padding: '8px', minWidth: '320px' } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: confirmColor === 'error' ? '#DC2626' : 'inherit' }}>
                {title}
            </DialogTitle>
            <DialogContent>
                {/* Mesajı dinamik olarak dışarıdan alıyoruz */}
                <DialogContentText sx={{ color: 'var(--text-muted)' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ padding: '16px' }}>
                <Button onClick={onCancel} sx={{ textTransform: 'none', color: '#6B7280' }} disabled={loading}>
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant="contained" color={confirmColor} sx={{ textTransform: 'none', borderRadius: '6px' }} disabled={loading}>
                    {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
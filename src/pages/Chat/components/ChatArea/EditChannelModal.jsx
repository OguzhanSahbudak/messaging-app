import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button, 
    CircularProgress 
} from '@mui/material';


import { updateChannel } from '../../../../store/chatSlice';

const EditChannelModal = ({ open, onClose, channel }) => {

    const dispatch=useDispatch();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

   useEffect(() => {
        if (channel && open) {
            setName(channel.name || '');
            setDescription(channel.description || '');
        }
    }, [channel, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await dispatch(updateChannel({
                channelId: channel.id,
                name,
                description
            })).unwrap();
            
            onClose(); 
        } catch (err) {
            console.error("Kanal güncellenirken hata oluştu:", err);
        } finally {
            setLoading(false);
        }
    };

  return (
   <Dialog 
            open={open} 
            onClose={!loading ? onClose : null} 
            fullWidth 
            maxWidth="xs"
            className="channel-edit-modal"
        >
            <DialogTitle className="channel-edit-title">
                Kanalı Düzenle
            </DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent className="channel-edit-form-content">
                    <TextField
                        label="Kanal Adı"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        autoFocus
                    />
                    <TextField
                        label="Kanal Açıklaması"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        placeholder="Bu kanal ne hakkında?"
                    />
                </DialogContent>
                
                <DialogActions className="channel-edit-actions">
                    <Button 
                        onClick={onClose} 
                        disabled={loading} 
                        className="btn-channel-cancel"
                    >
                        İptal
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading || !name.trim()} 
                        className="btn-channel-save"
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Kaydet'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
  )
}

export default EditChannelModal
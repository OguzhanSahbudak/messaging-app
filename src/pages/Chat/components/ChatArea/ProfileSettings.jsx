import React from 'react';
import { TextField } from '@mui/material';

// === PROFİL DÜZENLEME ALT BİLEŞENİ ===
const ProfileSettings = ({ firstName, lastName, onFirstNameChange, onLastNameChange, loading }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
            <TextField
                label="Adınız"
                variant="outlined"
                size="small"
                fullWidth
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                disabled={loading}
            />
            <TextField
                label="Soyadınız"
                variant="outlined"
                size="small"
                fullWidth
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                disabled={loading}
            />
        </div>
    );
};

export default ProfileSettings;
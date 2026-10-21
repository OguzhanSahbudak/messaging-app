import React from 'react';
import { Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';
import { MdPersonRemove } from "react-icons/md";

// === ÜYE YÖNETİMİ ALT BİLEŞENİ ===
const MemberManagement = ({
    otherMembers,
    selectedUserId,
    onMemberSelect,
    memberFirstName,
    onMemberFirstNameChange,
    memberLastName,
    onMemberLastNameChange,
    onRemoveClick,
    loading
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
            <Typography variant="caption" color="textSecondary">
                Yönetim Havuzu: <strong>Ortak Ana Kanal</strong>
            </Typography>

            {otherMembers.length === 0 ? (
                <p>Bu kanalda güncellenebilecek başka üye bulunamadı.</p>
            ) : (
                <>
                    <FormControl fullWidth size="small">
                        <InputLabel id="select-member-label">Güncellenecek Üye</InputLabel>
                        <Select
                            labelId="select-member-label"
                            value={selectedUserId || ''}
                            label="Güncellenecek Üye"
                            onChange={onMemberSelect}
                            disabled={loading}
                        >
                            {otherMembers.map((member, index) => {
                                const memberUserId = String(member.user_id || member.id || member.user?.id || index);
                                const fName = member.first_name || member.user?.first_name || '';
                                const lName = member.last_name || member.user?.last_name || '';
                                const uName = member.username || member.user?.username || 'Kullanıcı';

                                return (
                                    <MenuItem key={memberUserId} value={memberUserId}>
                                        {fName || lName ? `${fName} ${lName}` : 'İsimsiz Üye'} ({uName})
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Üye Adı"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={memberFirstName}
                        onChange={(e) => onMemberFirstNameChange(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        label="Üye Soyadı"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={memberLastName}
                        onChange={(e) => onMemberLastNameChange(e.target.value)}
                        disabled={loading}
                    />

                    <div style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<MdPersonRemove />}
                            onClick={onRemoveClick}
                            disabled={loading || !selectedUserId}
                            sx={{ textTransform: 'none', width: '100%', justifyContent: 'center', borderRadius: '8px' }}
                        >
                            Kullanıcıyı Kanaldan Çıkar
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default MemberManagement;
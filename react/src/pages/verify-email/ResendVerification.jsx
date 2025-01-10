import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/ErrorAlert.jsx'
const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({
    loading: false,
    type: '', // 'success' or 'error'
    message: ''
  });
  const { resendVerification } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setStatus({ loading: true, type: '', message: '' });

    const result = await resendVerification(email);
    
    setStatus({
      loading: false,
      type: result.success ? 'success' : 'error',
      message: result.success ? result.message : result.error
    });
    
    if (result.success) {
      setEmail('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
      <Typography variant="body1" gutterBottom>
        Enter your email to resend the verification link
      </Typography>
      
      <TextField
        fullWidth
        label="Email"
        variant="outlined"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status.loading}
        sx={{ mb: 2, mt: 1 }}
      />

      {status.message && (
       <ErrorAlert
       severity={status.type}
       error={status.message}
       onClose={() => setStatus({ ...status, message: '' })}
     />
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        disabled={status.loading}
      >
        {status.loading ? 'Sending...' : 'Resend Verification Link'}
      </Button>
    </Box>
  );
};

export default ResendVerification;

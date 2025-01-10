import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useAuth } from '../../context/AuthContext';
import ResendVerification from './ResendVerification';

const VerifyEmail = () => {
  const [state, setState] = useState({
    status: 'verifying',
    message: ''
  });
  const { token } = useParams();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const verify = async () => {
      const result = await verifyEmail(token);
      setState({
        status: result.success ? 'success' : 'error',
        message: result.message || result.error
      });
    };

    verify();
  }, [token, verifyEmail]);

  const renderContent = () => {
    switch (state.status) {
      case 'verifying':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Verifying your email...</Typography>
          </Box>
        );

      case 'success':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h6" textAlign="center">
              {state.message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/login"
              sx={{ mt: 2 }}
            >
              Login Now
            </Button>
          </Box>
        );

      case 'error':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <ErrorIcon color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h6" textAlign="center" color="error">
              {state.message}
            </Typography>
            {state.status === 'error' && <ResendVerification />}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center'
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;

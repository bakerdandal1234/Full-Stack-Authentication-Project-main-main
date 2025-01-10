import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setAccessToken } from '../../utils/axios';
import { CircularProgress, Box, Typography } from '@mui/material';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Set the token in axios
      setAccessToken(token);
      
      // Update authentication state and get user data
      const initAuth = async () => {
        try {
          await checkAuth(); // This will set isAuthenticated and user data
          navigate('/home');
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          navigate('/login');
        }
      };
      
      initAuth();
    } else {
      console.error('No token received from OAuth provider');
      navigate('/login');
    }
  }, [location, navigate, setIsAuthenticated, checkAuth]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthSuccess;

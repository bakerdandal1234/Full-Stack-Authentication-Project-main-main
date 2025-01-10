import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  useTheme,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Security,
  Speed,
  DevicesOutlined,
  AccountCircle
} from '@mui/icons-material';

const features = [
  {
    icon: <Security fontSize="large" />,
    title: 'Secure Authentication',
    description: 'State-of-the-art security protocols to keep your data safe'
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Fast Performance',
    description: 'Optimized for speed and efficiency across all devices'
  },
  {
    icon: <DevicesOutlined fontSize="large" />,
    title: 'Responsive Design',
    description: 'Beautiful and functional on any screen size'
  },
  {
    icon: <AccountCircle fontSize="large" />,
    title: 'User Friendly',
    description: 'Intuitive interface for the best user experience'
  }
];

const Welcome = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: 'calc(100vh - 48px)' }}>
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{
          position: 'relative',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(25, 118, 210, 0.08)'
            : 'rgba(25, 118, 210, 0.05)',
          py: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                component="h1"
                variant="h2"
                color="primary"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Welcome to MyApp
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                paragraph
                sx={{ mb: 4 }}
              >
                Your secure and modern authentication solution. Start your journey with us today.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  size="large"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: '400px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(25, 118, 210, 0.12)'
                    : 'rgba(25, 118, 210, 0.08)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    background: `linear-gradient(
                      45deg,
                      ${theme.palette.primary.main}22 25%,
                      transparent 25%,
                      transparent 50%,
                      ${theme.palette.primary.main}22 50%,
                      ${theme.palette.primary.main}22 75%,
                      transparent 75%,
                      transparent
                    )`,
                    backgroundSize: '40px 40px',
                    animation: 'move 3s linear infinite',
                  },
                  '@keyframes move': {
                    '0%': {
                      transform: 'translate(-50%, -50%) rotate(0deg)',
                    },
                    '100%': {
                      transform: 'translate(-50%, -50%) rotate(360deg)',
                    },
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '80%',
                    height: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '8px',
                    boxShadow: theme.shadows[4],
                    p: 3,
                    textAlign: 'center'
                  }}
                >
                  <Security 
                    sx={{ 
                      fontSize: '4rem',
                      color: theme.palette.primary.main
                    }} 
                  />
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  >
                    Secure Authentication
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                  >
                    State-of-the-art security for your peace of mind
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 6
          }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'primary.main'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Welcome;

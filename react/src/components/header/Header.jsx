import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ColorModeContext } from "../../pages/theme";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  useTheme,
  Stack,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  DarkModeOutlined,
  LightModeOutlined,
  Logout,
  Login,
  Add as AddIcon
} from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: []
  });

  const isAdmin = user && user.role === 'admin';

  const handleModalOpen = () => setOpenModal(true);
  const handleModalClose = () => setOpenModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Product Data:', productData);
      handleModalClose();
      setProductData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        images: []
      });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            E-commerce
          </Typography>

          <Stack direction="row" spacing={2}>
            <IconButton color="inherit" onClick={colorMode.toggleColorMode}>
              {theme.palette.mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>

            {isAdmin && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={handleModalOpen}
              >
                Add Product
              </Button>
            )}

            {user ? (
              <Button
                color="inherit"
                startIcon={<Logout />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <Button
                color="inherit"
                startIcon={<Login />}
                component={Link}
                to="/login"
              >
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Modal
        open={openModal}
        onClose={handleModalClose}
        aria-labelledby="add-product-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
            Add New Product
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={productData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
              />
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={productData.price}
                onChange={handleInputChange}
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={productData.category}
                  label="Category"
                  onChange={handleInputChange}
                >
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                  <MenuItem value="books">Books</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Stock"
                name="stock"
                type="number"
                value={productData.stock}
                onChange={handleInputChange}
                required
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
              >
                Create Product
              </Button>
            </Stack>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default Header;

import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Box, CircularProgress } from '@mui/material';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/ecommerce/products', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('فشل في جلب المنتجات');
        }

        const data = await response.json();
        console.log('Fetched products:', data);
        
        if (data.success) {
          setProducts(data.data);
        } else {
          throw new Error(data.message || 'حدث خطأ أثناء جلب المنتجات');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h6" color="textSecondary">
          لا توجد منتجات متاحة حالياً
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 6
                }
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={product.images[0]?.url || 'https://via.placeholder.com/300'}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  ${product.price.toFixed(2)}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    التصنيف: {product.category?.name || 'غير مصنف'}
                  </Typography>
                  <Typography variant="body2" color={product.stock > 0 ? 'success.main' : 'error.main'}>
                    {product.stock > 0 ? `المخزون: ${product.stock}` : 'نفذ من المخزون'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
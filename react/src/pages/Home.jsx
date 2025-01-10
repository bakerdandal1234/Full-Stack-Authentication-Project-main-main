import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Box,
  Skeleton,
  Rating,
  Chip,
  useTheme,
  IconButton,
} from '@mui/material';
import Header from '../components/header/Header';
import { ShoppingCart, Favorite } from '@mui/icons-material';

// مكون ProductCard - لعرض المنتج الواحد
const ProductCard = ({ product }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        }
      }}
    >
      {/* صورة المنتج */}
      <CardMedia
        component="img"
        height="200"
        image={product.images[0]?.url || 'https://via.placeholder.com/200'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />

      {/* أزرار العمليات */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <IconButton 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { bgcolor: 'white' }
          }}
        >
          <Favorite sx={{ color: theme.palette.error.main }} />
        </IconButton>
        <IconButton 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { bgcolor: 'white' }
          }}
        >
          <ShoppingCart sx={{ color: theme.palette.primary.main }} />
        </IconButton>
      </Box>

      {/* محتوى المنتج */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography 
          variant="h6" 
          component="h2"
          sx={{ 
            fontSize: '1rem',
            fontWeight: 600,
            mb: 1,
            height: '48px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Rating value={4} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            (4.0)
          </Typography>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 1,
            height: '40px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
            ${product.price}
          </Typography>
          <Chip 
            label={product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            color={product.stock > 0 ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// مكون الصفحة الرئيسية
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // محاكاة جلب البيانات من الخادم
  useEffect(() => {
    // هنا سيتم استبدال هذا بطلب API حقيقي
    const mockProducts = [
      {
        id: 1,
        name: "iPhone 13 Pro Max",
        description: "أحدث إصدار من هواتف Apple مع كاميرا متطورة وأداء استثنائي",
        price: 1099.99,
        stock: 10,
        images: [{ url: "https://via.placeholder.com/300" }]
      },
      // يمكنك إضافة المزيد من المنتجات هنا
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      <Header />
      <Container sx={{ mt: 4, mb: 8 }}>
        {/* عنوان القسم */}
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 4, 
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          Our Products
        </Typography>

        {/* شبكة المنتجات */}
        <Grid container spacing={3}>
          {loading ? (
            // حالة التحميل
            [...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={24} width="60%" />
                    <Skeleton variant="text" height={40} />
                    <Skeleton variant="text" height={24} width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            // عرض المنتجات
            products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </>
  );
}

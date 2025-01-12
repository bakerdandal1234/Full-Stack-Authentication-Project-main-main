const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Product, Category, Order } = require('../models/ecommerceSchema');
const { authenticateUser } = require('../middleware');
const { handleServerError, handleNotFound } = require('../utils/errorHandler');

// تكوين التخزين لـ multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// تكوين multer
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('نوع الملف غير مدعوم'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 ميجابايت
    }
});

// إضافة middleware لخدمة الملفات الثابتة
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================================================
// مسارات المنتجات (Products Routes)
// ============================================================================

// الحصول على جميع المنتجات
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json({ success: true, data: products });
    } catch (error) {
        handleServerError(res, error);
    }
});

// إضافة منتج جديد (للمشرفين فقط)
router.post('/products', 
    authenticateUser,
    upload.array('images', 5), // السماح بتحميل حتى 5 صور
    async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        console.log('User data:', req.user); // سجل بيانات المستخدم للتأكد
        
        // التحقق من صلاحيات المستخدم
        if (req.user.role !== 'user') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بإضافة منتجات. يجب أن تكون مشرف.',
                userRole: req.user.role
            });
        }

        console.log('Received product data:', req.body); // سجل البيانات المستلمة
        console.log('Received files:', req.files);

        // تحويل البيانات إلى الأنواع المناسبة
        const productData = {
            ...req.body,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            images: req.files ? req.files.map(file => file.filename) : []
        };

        // البحث عن التصنيف أو إنشاء تصنيف جديد
        let category;
        try {
            category = await Category.findOne({ name: req.body.category });
            if (!category) {
                category = await Category.create({ 
                    name: req.body.category,
                    description: `تصنيف ${req.body.category}`
                });
                console.log('Created new category:', category);
            }
        } catch (error) {
            console.error('Error with category:', error);
            return res.status(400).json({
                success: false,
                message: 'خطأ في معالجة التصنيف',
                error: error.message
            });
        }

        // إنشاء المنتج مع التصنيف الصحيح
        productData.category = category._id; // استخدام معرف التصنيف

        console.log('Final product data:', productData); // سجل البيانات النهائية

        const product = new Product(productData);
        await product.save();
        
        // تحميل بيانات التصنيف في المنتج المحفوظ
        await product.populate('category');
        
        console.log('Product saved successfully:', product); // سجل المنتج المحفوظ
        
        res.status(201).json({ 
            success: true, 
            message: 'تم إضافة المنتج بنجاح',
            data: product 
        });
    } catch (error) {
        console.error('Error in product creation:', error); // سجل الأخطاء
        
        // إزالة الصور المحملة في حالة حدوث خطأ
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        handleServerError(res, error);
    }
});

// تحديث منتج
router.put('/products/:id', authenticateUser, upload.array('images'), async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, stock, category, discount } = req.body;
        
        console.log('Updating product:', productId);
        console.log('Request body:', req.body);
        console.log('Files:', req.files);

        // التحقق من المصادقة
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'غير مصرح' });
        }

        // البحث عن المنتج
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
        }

        const updateData = {
            name,
            description,
            price: parseFloat(price) || existingProduct.price,
            stock: parseInt(stock) || existingProduct.stock,
            category: category || existingProduct.category,
            discount: parseFloat(discount) || 0
        };

        // معالجة الصور
        if (req.files && req.files.length > 0) {
            console.log('Processing new images');
            
            // حذف الصور القديمة
            if (existingProduct.images && existingProduct.images.length > 0) {
                existingProduct.images.forEach(imagePath => {
                    const fullPath = path.join(__dirname, '..', 'uploads', imagePath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                });
            }

            // إضافة الصور الجديدة
            updateData.images = req.files.map(file => file.filename);
        }

        // تحديث المنتج
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        ).populate('category');

        if (!updatedProduct) {
            return res.status(500).json({ success: false, message: 'فشل في تحديث المنتج' });
        }

        console.log('Product updated successfully:', updatedProduct);
        res.json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تحديث المنتج',
            error: error.message 
        });
    }
});

// حذف منتج
router.delete('/products/:id', authenticateUser, async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        const productId = req.params.id;
        
        // البحث عن المنتج وحذفه
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        // حذف الصور المرتبطة بالمنتج
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '..', 'uploads', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        // حذف المنتج من قاعدة البيانات
        await Product.findByIdAndDelete(productId);

        res.json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        handleServerError(res, error);
    }
});

// ============================================================================
// مسارات التصنيفات (Categories Routes)
// ============================================================================

// الحصول على جميع التصنيفات
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, data: categories });
    } catch (error) {
        handleServerError(res, error);
    }
});

// إضافة تصنيف جديد (للمشرفين فقط)
router.post('/categories', authenticateUser, async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        // التحقق من صلاحيات المستخدم
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بإضافة تصنيفات' 
            });
        }

        const category = new Category(req.body);
        await category.save();
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        handleServerError(res, error);
    }
});

// ============================================================================
// مسارات الطلبات (Orders Routes)
// ============================================================================

// إنشاء طلب جديد
router.post('/orders', authenticateUser, async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        const order = new Order({
            ...req.body,
            user: req.user._id
        });
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        handleServerError(res, error);
    }
});

// الحصول على طلبات المستخدم
router.get('/orders/my-orders', authenticateUser, async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        const orders = await Order.find({ user: req.user._id })
            .populate('products.product');
        res.json({ success: true, data: orders });
    } catch (error) {
        handleServerError(res, error);
    }
});

// تحديث حالة الطلب (للمشرفين فقط)
router.put('/orders/:id/status', authenticateUser, async (req, res) => {
    try {
        // التحقق من وجود المستخدم وأنه مسجل الدخول
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        // التحقق من صلاحيات المستخدم
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بتعديل حالة الطلبات' 
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!order) return handleNotFound(res, 'الطلب غير موجود');
        res.json({ success: true, data: order });
    } catch (error) {
        handleServerError(res, error);
    }
});

// البحث عن المنتجات
router.get('/products/search', async (req, res) => {
    try {
        const { query } = req.query;
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).populate('category');
        res.json({ success: true, data: products });
    } catch (error) {
        handleServerError(res, error);
    }
});

module.exports = router;

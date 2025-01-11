const express = require('express');
const router = express.Router();
const { Product, Category, Order } = require('../models/ecommerceSchema');
const { authenticateUser } = require('../middleware');
const { handleServerError, handleNotFound } = require('../utils/errorHandler');

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
        const productData = {
            ...req.body,
            category: category._id // استخدام معرف التصنيف
        };

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
        handleServerError(res, error);
    }
});

// تحديث منتج
router.put('/products/:id', authenticateUser, async (req, res) => {
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
                message: 'غير مصرح لك بتعديل المنتجات' 
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!product) return handleNotFound(res, 'المنتج غير موجود');
        res.json({ success: true, data: product });
    } catch (error) {
        handleServerError(res, error);
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

        // التحقق من صلاحيات المستخدم
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بحذف المنتجات' 
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return handleNotFound(res, 'المنتج غير موجود');
        res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
    } catch (error) {
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

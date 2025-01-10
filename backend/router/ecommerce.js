const express = require('express');
const router = express.Router();
const { Product, Category, Order } = require('../models/ecommerceSchema');
const { authenticateUser } = require('../middleware');
const { handleServerError, handleNotFound } = require('../utils/errorHandler');
const csrf = require('csurf');

// إضافة CSRF middleware للمسارات الحساسة
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

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
  authenticateUser,  // التحقق من المصادقة أولاً
  csrfProtection,    // ثم التحقق من CSRF
  async (req, res) => {
    try {
        // التحقق من صلاحيات المستخدم
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بإضافة منتجات',
                userRole: req.user.role
            });
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        handleServerError(res, error);
    }
});

// تحديث منتج
router.put('/products/:id', authenticateUser, async (req, res) => {
    try {
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

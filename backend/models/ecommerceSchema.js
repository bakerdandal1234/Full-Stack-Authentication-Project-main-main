const mongoose = require('mongoose');

// Product Schema - مخطط المنتج
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم المنتج مطلوب'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'وصف المنتج مطلوب']
    },
    price: {
        type: Number,
        required: [true, 'سعر المنتج مطلوب'],
        min: [0, 'السعر يجب أن يكون أكبر من صفر']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    stock: {
        type: Number,
        required: [true, 'كمية المخزون مطلوبة'],
        min: [0, 'المخزون لا يمكن أن يكون سالباً']
    },
    images: [{
        url: String,
        alt: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Category Schema - مخطط التصنيف
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم التصنيف مطلوب'],
        unique: true
    },
    description: String,
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
});

// Order Schema - مخطط الطلب
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // يشير إلى مخطط المستخدم الموجود في Schema.js
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

// تصدير النماذج
const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = {
    Product,
    Category,
    Order
};

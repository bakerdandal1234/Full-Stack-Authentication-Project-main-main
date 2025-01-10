const rateLimit = require('express-rate-limit');

// إعداد حدود معدل الطلبات
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 دقيقة
    max: 10000,  // حد الطلبات لكل IP
    message: 'تم تجاوز عدد الطلبات المسموح به، الرجاء المحاولة لاحقاً',
    standardHeaders: true,
    legacyHeaders: false,
    // تخصيص رسائل الخطأ
    handler: (req, res) => {
        res.status(429).json({
            status: 'error',
            message: 'تم تجاوز عدد الطلبات المسموح به، الرجاء المحاولة بعد 15 دقيقة'
        });
    }
});

module.exports = apiLimiter;

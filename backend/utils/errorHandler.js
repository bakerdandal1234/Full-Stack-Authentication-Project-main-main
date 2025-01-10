// الدالة الأساسية لإرسال الأخطاء
exports.sendError = (res, error, statusCode = 401) => {
    return res.status(statusCode).json({
        status: 'error',
        message: error,
        code: error.code || `ERROR_${statusCode}`
    });
};

// معالجة أخطاء التحقق
exports.handleValidationError = (res, message) => {
    return exports.sendError(res, message, 400);
};

// معالجة أخطاء عدم التصريح
exports.handleUnauthorized = (res, message) => {
    return exports.sendError(res, message, 401);
};

// معالجة أخطاء عدم وجود المصدر
exports.handleNotFound = (res, message = 'Resource not found') => {
    return exports.sendError(res, message, 404);
};

// معالجة أخطاء الخادم
exports.handleServerError = (res, error) => {
    console.error('Server Error:', error);
    return exports.sendError(res, 'Internal server error', 500);
};

// Middleware لمعالجة أخطاء المصادقة
exports.authenticationErrorHandler = (err, req, res, next) => {
    if (err.name === "AuthenticationError") {
        return exports.sendError(res, err.message, 401);
    }
    next(err);
};

// Middleware للمعالجة العامة للأخطاء
exports.globalErrorHandler = (err, req, res, next) => {
    console.error(" Unhandled Error:", err);
    
    // معالجة أخطاء Mongoose
    if (err.name === 'ValidationError') {
        return exports.handleValidationError(res, err.message);
    }
    
    // معالجة أخطاء JWT
    if (err.name === 'JsonWebTokenError') {
        return exports.handleUnauthorized(res, 'Invalid token');
    }
    
    // معالجة أخطاء CSRF
    if (err.code === 'EBADCSRFTOKEN') {
        return exports.sendError(res, 'Invalid CSRF token', 403);
    }

    // معالجة باقي الأخطاء
    return exports.handleServerError(res, err);
};

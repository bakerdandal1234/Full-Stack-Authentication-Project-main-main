const csrf = require('csurf');


// تكوين حماية CSRF
const csrfProtection = csrf({
    cookie: {
        key: 'XSRF-TOKEN',
        httpOnly: false, // يجب أن تكون false حتى يتمكن JavaScript من قراءتها
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// الوسيط (middleware) للتعامل مع CSRF
const csrfMiddleware = (req, res, next) => {
    // تخطي التحقق من CSRF لبعض المسارات العامة
    const publicPaths = ['/login', '/signup'];
    if (publicPaths.includes(req.path)) {
        console.log(`[CSRF] Skipping CSRF check for public path: ${req.path}`);
        return next();
    }

    // تسجيل معلومات عن الطلب للتحقق
    console.log(`[CSRF] Checking CSRF token for path: ${req.path}`);
    
    // تطبيق حماية CSRF
    csrfProtection(req, res, (err) => {
        if (err) {
            console.error(`[CSRF] Validation failed:`, err.message);
            return res.status(403).json({
                error: 'CSRF token validation failed',
                message: 'Invalid or missing CSRF token'
            });
        }

        // إرسال التوكن الجديد في الاستجابة
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        console.log(`[CSRF] Token validation successful for ${req.path}`);
        console.log(`[CSRF] New token generated:`, token);
        next();
    });
};

// دالة مساعدة للتحقق من حالة CSRF
const verifyCsrfSetup = (req, res) => {
    return {
        hasCsrfToken: !!req.headers['xsrf-token'],
        hasCsrfCookie: !!req.cookies['XSRF-TOKEN'],
        isProtected: !publicPaths.includes(req.path)
    };
};

module.exports = {
    csrfMiddleware,
    csrfProtection,
    verifyCsrfSetup
};
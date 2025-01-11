const cors = require('cors');

// إعدادات CORS
const corsOptions = {
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Date',
        'X-Api-Version'
    ],
    exposedHeaders: ['X-CSRF-Token'], // Expose CSRF token header
    preflightContinue: false,
    optionsSuccessStatus: 200
};

// تصدير middleware الـ CORS
module.exports = cors(corsOptions);

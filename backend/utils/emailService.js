const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// إعداد OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// إنشاء قالب البريد الإلكتروني
function createEmailTemplate(title, message1, message2, buttonText, buttonUrl) {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f6f9fc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">${title}</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: right;">
                ${message1}
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px; text-align: right;">
                ${message2}
            </p>
            <div style="text-align: center;">
                <a href="${buttonUrl}" 
                   style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    ${buttonText}
                </a>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: right;">
                إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
            </p>
        </div>
    </body>
    </html>
    `;
}

// إنشاء ناقل البريد الإلكتروني
async function createTransporter() {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.RESEND_FROM_EMAIL,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        });
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
}

// إرسال بريد التحقق
async function sendVerificationEmail(email, verificationToken) {
    try {
        console.log('Starting to send verification email to:', email);
        
        const transporter = await createTransporter();
        const verificationUrl = `${process.env.APP_URL}/verify-email/${verificationToken}`;
        
        const mailOptions = {
            from: process.env.RESEND_FROM_EMAIL,
            to: email,
            subject: 'تأكيد البريد الإلكتروني',
            html: createEmailTemplate(
                'تأكيد البريد الإلكتروني',
                'شكراً لتسجيلك! يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني.',
                '',
                'تأكيد البريد الإلكتروني',
                verificationUrl
            )
        };
        
        console.log('Sending email with options:', mailOptions);
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully. Response:', result);
        
        return result;
    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        throw error;
    }
}

// إرسال بريد إعادة تعيين كلمة المرور
async function sendResetPasswordEmail(email, resetToken) {
    try {
       
        
        const transporter = await createTransporter();

        // تأكد من أن APP_URL صحيح (مثال: http://localhost:3000)
        const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
        
        console.log('Reset URL:', resetUrl); // للتحقق من الرابط

        const mailOptions = {
            from: process.env.RESEND_FROM_EMAIL,
            to: email,
            subject: 'إعادة تعيين كلمة المرور',
            html: createEmailTemplate(
                'إعادة تعيين كلمة المرور',
                'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.',
                'انقر على الزر أدناه لإعادة تعيين كلمة المرور. هذا الرابط صالح لمدة 5 دقائق فقط.',
                'إعادة تعيين كلمة المرور',
                resetUrl
            )
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reset password email sent:', info.response);
        
        return info;
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
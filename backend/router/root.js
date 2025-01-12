const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/Schema");
const bcrypt = require("bcrypt");
const { sendVerificationEmail } = require("../utils/emailService");
const { sendResetPasswordEmail } = require("../utils/emailService");
const { verifyToken } = require("../middleware");
const { authenticateUser } = require("../middleware");

const {
  sendError,
  handleUnauthorized,
  handleValidationError,
  handleServerError,
} = require("../utils/errorHandler");

// التحقق من صحة بيانات التسجيل
const signupValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("يجب أن يكون اسم المستخدم 3 أحرف على الأقل"),
  body("email").isEmail().withMessage("البريد الإلكتروني غير صالح"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("يجب أن تكون كلمة المرور 6 أحرف على الأقل"),
];
router.get('/',(req,res)=>{
  res.send("hello world")
})
// التسجيل
router.post("/signup", signupValidation, async (req, res) => {
  try {
    // التحقق من وجود أخطاء في التحقق
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleValidationError(res, errors);
    }

    const { username, email, password } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return sendError(res, "البريد الإلكتروني مسجل مسبقاً");
      }
      return sendError(res, "اسم المستخدم مسجل مسبقاً");
    }

    // إنشاء رمز التحقق
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // إنشاء المستخدم
    const user = new User({
      username,
      email,
      password,
      verificationToken,
    });

    await user.save();

    // إرسال بريد التحقق
    // await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// تسجيل الدخول
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    console.log("Found user:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return handleUnauthorized(res, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    // التحقق من كلمة المرور
    console.log("Comparing password...");
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password doesn't match");
      return handleUnauthorized(res, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    // إنشاء التوكن
    console.log("Creating tokens...");
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // إعداد الكوكيز
    console.log("Setting cookies...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log("Login successful");
    res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      accessToken: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    handleServerError(res, error);
  }
});

// تسجيل الخروج
router.post("/logout", authenticateUser, (req, res) => {
  try {
    // مسح جميع الكوكيز
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// تحديث التوكن
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return handleUnauthorized(res, "لم يتم العثور على توكن التحديث");
    }

    // البحث عن المستخدم بواسطة توكن التحديث
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return handleUnauthorized(res, "توكن التحديث غير صالح");
    }

    // إنشاء توكن جديد
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // تعيين التوكن الجديد في الكوكيز
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "تم تحديث التوكن بنجاح",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// إعادة إرسال رمز التحقق
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "البريد الإلكتروني غير مسجل");
    }

    if (user.isVerified) {
      return sendError(res, "الحساب مفعل بالفعل");
    }

    // إنشاء رمز تحقق جديد
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // إرسال بريد التحقق
    await sendVerificationEmail(email, verificationToken);

    res.json({
      success: true,
      message: "تم إرسال رمز التحقق. يرجى التحقق من بريدك الإلكتروني",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// التحقق من البريد الإلكتروني
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // البحث عن المستخدم بواسطة رمز التحقق
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return sendError(res, "رمز التحقق غير صالح");
    }

    // تفعيل الحساب
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: "تم تفعيل الحساب بنجاح",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// طلب إعادة تعيين كلمة المرور
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "البريد الإلكتروني غير مسجل");
    }

    // إنشاء رمز إعادة التعيين
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // ساعة واحدة

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // إرسال بريد إعادة التعيين
    await sendResetPasswordEmail(email, resetToken);

    res.json({
      success: true,
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// التحقق من رمز إعادة التعيين
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // البحث عن المستخدم بواسطة رمز إعادة التعيين
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية");
    }

    res.json({
      success: true,
      message: "رمز إعادة التعيين صالح",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// إعادة تعيين كلمة المرور
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // البحث عن المستخدم بواسطة رمز إعادة التعيين
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية");
    }

    // تحديث كلمة المرور
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "تم إعادة تعيين كلمة المرور بنجاح",
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

module.exports = router;

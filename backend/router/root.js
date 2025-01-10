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
const csrf = require("csurf");
const {
  sendError,
  handleUnauthorized,
  handleValidationError,
  handleServerError,
} = require("../utils/errorHandler");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         isVerified:
 *           type: boolean
 *       required:
 *         - id
 *         - username
 *         - email
 *         - isVerified
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 *       required:
 *         - message
 *         - error
 */

// Middleware for parsing JSON bodies
router.use(express.json());

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Validation middleware
const signupValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: إنشاء حساب جديد
 *     description: إنشاء حساب جديد للمستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/signup", signupValidation, async (req, res) => {
  try {
    // التحقق من وجود أخطاء في التحقق
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    // التحقق من وجود المستخدم مسبقاً
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.log('Existing user found:', existingUser.email === email ? 'email exists' : 'username exists');
      return res.status(400).json({
        success: false,
        error: [{
          path: existingUser.email === email ? "email" : "username",
          msg: `This ${existingUser.email === email ? "email" : "username"} is already registered`
        }]
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 10 * 1000); // 2 minutes

    // Create new user with all required fields
    const user = await User.create({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpiry,
    });

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15s",
    });

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Send verification email
    // await sendVerificationEmail(email, verificationToken);

    // Send response
    return res.status(201).json({
      success: true,
      message: "User created successfully. Please check your email for verification.",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      error: [{
        msg: "Internal server error. Please try again later."
      }]
    });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: تسجيل الدخول
 *     description: تسجيل الدخول للمستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return handleUnauthorized(
        res,
        "Email not found. Please check your email and try again."
      );
    }

    // Check if user was created through OAuth
    if (user.googleId || user.githubId) {
      return handleUnauthorized(
        res,
        "This email is associated with a Google or GitHub account. Please sign in with the appropriate social login."
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid password for:", email);
      return handleUnauthorized(
        res,
        "Password is incorrect. Please try again."
      );
    }

    // Check if user is verified
    // if (!user.isVerified) {
    //   return handleUnauthorized(res,   'Please verify your email before logging in');
    // }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Set tokens in cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role || "user",
      },
      accessToken,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: تحديث رمز الوصول
 *     description: تحديث رمز الوصول للمستخدم
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تحديث رمز الوصول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.cookies.token;
    console.log("Refresh token received:", !!refreshToken); // Debug log

    if (!refreshToken) {
      return handleUnauthorized(res, { message: "No refresh token provided" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("Token decoded:", decoded); // Debug log

    // Find user and include refreshToken field
    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user) {
      console.log("User not found for token:", decoded.userId); // Debug log
      return handleUnauthorized(res, { message: "User not found" });
    }

    // Generate new tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Send response with new tokens
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: تسجيل الخروج
 *     description: تسجيل الخروج للمستخدم
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", authenticateUser, (req, res) => {
  try {
    // مسح جميع الكوكيز
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.clearCookie("XSRF-TOKEN");
    res.clearCookie("_csrf");

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: الصفحة الرئيسية
 *     description: إرجاع رسالة ترحيب بسيطة
 *     responses:
 *       200:
 *         description: تم استرجاع الرسالة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/", (req, res) => {
  res.send("Hello World!");
});

/**
 * @swagger
 * /protected-route:
 *   get:
 *     summary: المسار المحمي
 *     description: إرجاع رسالة للمستخدمين الذين لديهم صلاحية الوصول
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم الوصول إلى المسار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.use("/protected-route", verifyToken, (req, res) => {
  res.json({ message: "تم الوصول إلى المسار المحمي" });
});

/**
 * @swagger
 * /verify-email/{token}:
 *   get:
 *     summary: التحقق من البريد الإلكتروني
 *     description: التحقق من البريد الإلكتروني للمستخدم
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: رمز التحقق
 *     responses:
 *       200:
 *         description: تم التحقق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Verifying email token:", token);

    // البحث عن المستخدم بواسطة رمز التحقق
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    console.log("User found:", user);
    console.log("Current time:", new Date());
    console.log("Token expiry:", user?.verificationTokenExpiry);

    if (!user) {
      return handleValidationError(res, "Invalid or expired verification link");
    }

    if (user.isVerified) {
      return res.status(200).json({
        status: "success",
        message: "Email already verified",
        isVerified: true,
      });
    }

    // Update verification status
    user.isVerified = true;
    await user.save();

    // Clear verification token and expiry after 2 minutes
    setTimeout(async () => {
      try {
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();
        console.log(
          "Verification token and expiry cleared for user:",
          user.email
        );
      } catch (error) {
        console.error("Error clearing verification token:", error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    res.json({
      status: "success",
      message: "Email verified successfully",
      isVerified: true,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /resend-verification:
 *   post:
 *     summary: إعادة إرسال رمز التحقق
 *     description: إعادة إرسال رمز التحقق للمستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: تم إعادة إرسال رمز التحقق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return handleValidationError(res, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return handleUnauthorized(res, {
        message: "No account found with this email",
      });
    }

    if (user.isVerified) {
      return handleValidationError(res, "Email is already verified");
    }

    // Create new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await user.save();

    console.log(
      "Generated new verification token with expiry:",
      user.verificationTokenExpiry
    );

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({
      message: "Verification link has been sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: إعادة تعيين كلمة المرور
 *     description: إعادة تعيين كلمة المرور للمستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: تم إعادة تعيين كلمة المرور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  try {
    // التحقق من وجود المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return handleUnauthorized(res, "No account found with this email");
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // صالح لمدة ساعة واحدة
    await user.save();

    console.log(
      "Generated new reset token with expiry:",
      user.resetPasswordExpiry
    );

    // إرسال رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني
    await sendResetPasswordEmail(email, resetToken);

    res.json({ message: "Password reset link has been sent to your email" });
  } catch (error) {
    console.error("Reset password error:", error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /verify-reset-token/{token}:
 *   get:
 *     summary: التحقق من رمز إعادة تعيين كلمة المرور
 *     description: التحقق من رمز إعادة تعيين كلمة المرور للمستخدم
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: رمز إعادة تعيين كلمة المرور
 *     responses:
 *       200:
 *         description: تم التحقق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // البحث عن المستخدم بواسطة الرمز والتحقق من الصلاحية
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return handleValidationError(
        res,
        "The password reset link has expired. Please request a new link from the login page."
      );
    }

    res.json({ message: "Token is valid" });
  } catch (error) {
    console.error("Token verification error:", error);
    handleServerError(res);
  }
});

/**
 * @swagger
 * /reset-password/{token}:
 *   post:
 *     summary: إعادة تعيين كلمة المرور
 *     description: إعادة تعيين كلمة المرور للمستخدم
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: رمز إعادة تعيين كلمة المرور
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *             required:
 *               - newPassword
 *     responses:
 *       200:
 *         description: تم إعادة تعيين كلمة المرور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: خطأ في البيانات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // التحقق من قوة كلمة المرور الجديدة
    if (newPassword.length < 6) {
      return handleValidationError(
        res,
        "Password must be at least 6 characters long"
      );
    }

    // تحديث كلمة المرور مباشرة
    const user = await User.findOneAndUpdate(
      { resetPasswordToken: token },
      {
        password: newPassword,
        resetPasswordToken: undefined,
        resetPasswordExpiry: undefined,
      },
      { new: true }
    );

    res.json({
      success: true,
      message:
        "Your password has been successfully reset. Please login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    handleServerError(res);
  }
});



module.exports = router;

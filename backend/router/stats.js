const express = require('express');
const router = express.Router();
const User = require('../models/Schema');
const { authenticateUser } = require('../middleware');
const { handleServerError } = require('../utils/errorHandler');

/**
 * @swagger
 * /api/stats/users:
 *   get:
 *     summary: إحصائيات المستخدمين الأساسية
 *     description: يقوم بجلب إحصائيات أساسية عن المستخدمين
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الإحصائيات بنجاح
 */
router.get('/users', authenticateUser, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          'totalUsers': [
            { $count: 'count' }
          ],
          'verifiedUsers': [
            { $match: { isVerified: true } },
            { $count: 'count' }
          ],
          'registrationsByDate': [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          'registrationMethods': [
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: ["$provider", "local"] },
                    "التسجيل المباشر",
                    "$provider"
                  ]
                },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const formattedStats = {
      totalUsers: stats[0].totalUsers[0]?.count || 0,
      verifiedUsers: stats[0].verifiedUsers[0]?.count || 0,
      registrationsByDate: stats[0].registrationsByDate,
      registrationMethods: stats[0].registrationMethods
    };

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /api/stats/activity:
 *   get:
 *     summary: إحصائيات نشاط المستخدمين
 *     description: يقوم بجلب إحصائيات عن نشاط المستخدمين
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات النشاط بنجاح
 */
router.get('/activity', authenticateUser, async (req, res) => {
  try {
    const activityStats = await User.aggregate([
      {
        $facet: {
          'lastLoginStats': [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$lastLogin"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          'activeUsers': [
            {
              $match: {
                lastLogin: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            { $count: 'count' }
          ],
          'usersByVerificationStatus': [
            {
              $group: {
                _id: '$isVerified',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const formattedActivity = {
      lastLoginStats: activityStats[0].lastLoginStats,
      activeUsers: activityStats[0].activeUsers[0]?.count || 0,
      verificationStatus: activityStats[0].usersByVerificationStatus.reduce((acc, curr) => {
        acc[curr._id ? 'verified' : 'unverified'] = curr.count;
        return acc;
      }, { verified: 0, unverified: 0 })
    };

    res.json(formattedActivity);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return handleServerError(res, error);
  }
});

/**
 * @swagger
 * /api/stats/security:
 *   get:
 *     summary: إحصائيات الأمان
 *     description: يقوم بجلب إحصائيات عن حالة أمان الحسابات
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات الأمان بنجاح
 */
router.get('/security', authenticateUser, async (req, res) => {
  try {
    const securityStats = await User.aggregate([
      {
        $facet: {
          'passwordResetStats': [
            {
              $match: {
                resetPasswordToken: { $exists: true }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$resetPasswordExpiry"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          'loginAttempts': [
            {
              $group: {
                _id: "$email",
                attempts: { $sum: { $size: { $ifNull: ["$loginAttempts", []] } } }
              }
            },
            {
              $group: {
                _id: null,
                averageAttempts: { $avg: "$attempts" },
                maxAttempts: { $max: "$attempts" }
              }
            }
          ]
        }
      }
    ]);

    const formattedSecurity = {
      passwordResetStats: securityStats[0].passwordResetStats,
      loginAttempts: securityStats[0].loginAttempts[0] || { averageAttempts: 0, maxAttempts: 0 }
    };

    res.json(formattedSecurity);
  } catch (error) {
    console.error('Error fetching security stats:', error);
    return handleServerError(res, error);
  }
});

module.exports = router;

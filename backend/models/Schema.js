const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: function() {
            return !this.githubId && !this.googleId && !this.linkedinId; // Only required if not using OAuth
        },
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            return !this.githubId && !this.googleId && !this.linkedinId; // Only required if not using OAuth
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    githubId: {
        type: String,
        sparse: true,
        unique: true
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        try {
            console.log('Hashing password for user:', this.email);
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            console.log('Password hashed successfully');
        } catch (error) {
            console.error('Error hashing password:', error);
            return next(error);
        }
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    console.log('Comparing passwords for user:', this.email);
    console.log('Has password:', !!this.password);
    if (!this.password) return false;
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match:', isMatch);
    return isMatch;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
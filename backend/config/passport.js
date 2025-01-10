const passport = require('passport');

class PassportAuthenticator {
    constructor(userModel) {
        if (!userModel) {
            throw new Error('User model is required for PassportAuthenticator');
        }
        this.User = userModel;
        this.strategies = new Map();
        this._initializePassport();
    }

    _initializePassport() {
        passport.serializeUser((user, done) => done(null, user.id));
        passport.deserializeUser(async (id, done) => {
            try {
                const user = await this.User.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
    }

    async _handleStrategy(provider, accessToken, refreshToken, profile, done) {
        try {
            let user = await this.User.findOne({ [`${provider}Id`]: profile.id });
            
            if (!user) {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error('Email is required'), null);
                }

                user = await this.User.findOne({ email });
                
                if (user) {
                    if (user[`${provider}Id`]) {
                        return done(new Error('Account already exists'), null);
                    }
                    
                    user[`${provider}Id`] = profile.id;
                    user.isVerified = true;
                    user = await user.save();
                } else {
                    user = await this.User.create({
                        email,
                        [`${provider}Id`]: profile.id,
                        isVerified: true
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    addStrategy(name, Strategy, config) {
        if (!name || !Strategy || !config) {
            throw new Error('Name, Strategy and config are required');
        }

        const strategy = new Strategy({
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            callbackURL: config.callbackURL,
            ...config.additionalOptions
        }, (accessToken, refreshToken, profile, done) => {
            this._handleStrategy(name.toLowerCase(), accessToken, refreshToken, profile, done);
        });

        passport.use(name, strategy);
        this.strategies.set(name, strategy);
    }

    authenticate(name, options = {}) {
        if (!this.strategies.has(name)) {
            throw new Error(`Strategy ${name} not found`);
        }
        return passport.authenticate(name, options);
    }

    getPassport() {
        return passport;
    }

    isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ 
            status: 'error',
            message: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
    }
}

module.exports = PassportAuthenticator;

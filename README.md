# Full-Stack Authentication Project

## Overview
A modern, secure, and feature-rich authentication system built with React and Express.js. This project implements best practices for user authentication, including email verification, password reset, and comprehensive error handling.

## Features
### Authentication
- Local authentication with email and password
- Email verification system
- Secure password reset functionality
- JWT-based authentication with access and refresh tokens
- Session management and automatic token refresh
- Secure password hashing with bcrypt

### Security
- Rate limiting (15 requests per 15 minutes)
- CORS protection
- XSS protection
- CSRF protection
- Secure HTTP-only cookies
- Input validation and sanitization

### User Experience
- Modern, responsive Material-UI design
- Real-time form validation
- Comprehensive error handling and user feedback
- Loading states and progress indicators
- Persistent authentication state
- Mobile-friendly interface

## Tech Stack
### Frontend
- React 18
- Material-UI (MUI)
- React Router v6
- Axios for API requests
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services
- Express-rate-limit for rate limiting

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- SMTP server credentials for email services

## Setup Instructions

### 1. Clone the Repository
```bash
git clone [repository-url]
cd Full-Stack-Authentication-Project
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file with the following variables:
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd react
npm install

# Create .env file with:
VITE_API_URL=http://localhost:3000
```

### 4. Start the Application
Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd react
npm run dev
```

## API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /auth/me` - Get current user

### Email Verification
- `GET /verify-email/:token` - Verify email
- `POST /resend-verification` - Resend verification email

### Password Reset
- `POST /reset-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-reset-token/:token` - Verify reset token

## Error Handling
The application includes comprehensive error handling:
- Validation errors
- Authentication errors
- Server errors
- Network errors
- Rate limiting errors

## Security Measures
1. **Password Security**
   - Passwords are hashed using bcrypt
   - Minimum password requirements enforced
   - Secure password reset flow

2. **API Security**
   - Rate limiting to prevent brute force attacks
   - JWT tokens with expiration
   - HTTP-only cookies for token storage
   - CORS configuration

3. **Data Validation**
   - Input sanitization
   - Strong validation rules
   - Error handling for all edge cases

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License.

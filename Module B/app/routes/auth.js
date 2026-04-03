/**
 * Authentication Routes
 * 
 * Provides:
 * - POST /login: User login and JWT token generation
 * - GET /isAuth: Token validation and user info retrieval
 */

const bcrypt = require('bcryptjs');
const { generateToken, verifyToken, logSecurityEvent } = require('../middleware/rbac');

/**
 * POST /login
 * 
 * Authenticates a user and issues a JWT token
 * 
 * Request Body:
 * {
 *   "username": "string",
 *   "password": "string"
 * }
 * 
 * Response (200 - Success):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": number,
 *     "username": "string",
 *     "role": "admin" | "user",
 *     "email": "string"
 *   }
 * }
 * 
 * Response (400 - Invalid Input):
 * {
 *   "success": false,
 *   "message": "Username and password are required"
 * }
 * 
 * Response (401 - Authentication Failed):
 * {
 *   "success": false,
 *   "message": "Invalid username or password"
 * }
 * 
 * Response (500 - Server Error):
 * {
 *   "success": false,
 *   "message": "An error occurred during login"
 * }
 */
const loginUser = (req, res, db) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    logSecurityEvent(req, 'LOGIN_INVALID_INPUT', 'Missing username or password');
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
    });
  }

  // Query user from database
  const query = 'SELECT person_id, username, password_hash, role, email FROM users WHERE username = ?';

  db.get(query, [username], (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      logSecurityEvent(req, 'LOGIN_DB_ERROR', err.message);
      return res.status(500).json({
        success: false,
        message: 'query error',
      });
    }

    // User not found
    if (!user) {
      logSecurityEvent(req, 'LOGIN_USER_NOT_FOUND', `Username: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Verify password
    bcrypt.compare(password, user.password_hash, (err, isValidPassword) => {
      if (err) {
        console.error('Password comparison error:', err.message);
        logSecurityEvent(req, 'LOGIN_CRYPTO_ERROR', err.message);
        return res.status(500).json({
          success: false,
          message: 'password comparison error',
        });
      }

      // Password is incorrect
      if (!isValidPassword) {
        logSecurityEvent(req, 'LOGIN_INVALID_PASSWORD', `Username: ${username}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.person_id,
        username: user.username,
        role: user.role,
      });

      logSecurityEvent(req, 'LOGIN_SUCCESS', `User: ${username} (${user.role})`);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          person_id: user.person_id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      });
    });
  });
};

/**
 * GET /isAuth
 * 
 * Validates a JWT token and returns authenticated user information
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <jwt_token>"
 * }
 * 
 * Response (200 - Valid Token):
 * {
 *   "authenticated": true,
 *   "user": {
 *     "id": number,
 *     "username": "string",
 *     "role": "admin" | "user"
 *   }
 * }
 * 
 * Response (401 - Missing Token):
 * {
 *   "authenticated": false,
 *   "message": "No token provided"
 * }
 * 
 * Response (401 - Expired Token):
 * {
 *   "authenticated": false,
 *   "message": "Token has expired"
 * }
 * 
 * Response (403 - Invalid Token):
 * {
 *   "authenticated": false,
 *   "message": "Invalid token"
 * }
 */
const isAuthUser = (req, res) => {
  const authHeader = req.headers['authorization'];

  // Extract Bearer token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logSecurityEvent(req, 'ISAUTH_NO_TOKEN', 'Missing authorization header');
    return res.status(401).json({
      authenticated: false,
      message: 'No token provided',
    });
  }

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    logSecurityEvent(req, 'ISAUTH_INVALID_TOKEN', 'Token verification failed');
    return res.status(403).json({
      authenticated: false,
      message: 'Invalid token',
    });
  }

  logSecurityEvent(req, 'ISAUTH_SUCCESS', `User: ${decoded.username} (${decoded.role})`);

  res.status(200).json({
    authenticated: true,
    user: {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    },
  });
};

module.exports = {
  loginUser,
  isAuthUser,
};

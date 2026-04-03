/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Provides:
 * - JWT Token Verification (authenticateJWT)
 * - Role-Based Authorization (authorizeRole)
 * - User Context Injection
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Secret key for JWT signing and verification
// In production, this should be loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authenticate JWT Token Middleware
 * 
 * - Extracts token from Authorization header
 * - Verifies token signature and expiration
 * - Attaches user payload to req.user
 * - Returns 401 if token is invalid or missing
 * 
 * Usage:
 * app.get('/protected', authenticateJWT, (req, res) => { ... })
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Extract Bearer token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logSecurityEvent(req, 'TOKEN_MISSING', 'No authorization token provided');
    return res.status(401).json({
      authenticated: false,
      message: 'Authorization token missing',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request

    logSecurityEvent(req, 'TOKEN_VALID', `User ${decoded.username} (${decoded.role})`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logSecurityEvent(req, 'TOKEN_EXPIRED', err.message);
      return res.status(401).json({
        authenticated: false,
        message: 'Token has expired',
      });
    }

    logSecurityEvent(req, 'TOKEN_INVALID', err.message);
    return res.status(403).json({
      authenticated: false,
      message: 'Invalid token',
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * 
 * - Checks if user's role is authorized for the route
 * - Supports single role or array of roles
 * - Returns 403 if user lacks required role
 * 
 * Usage:
 * app.get('/admin', authenticateJWT, authorizeRole('admin'), (req, res) => { ... })
 * app.get('/data', authenticateJWT, authorizeRole(['admin', 'user']), (req, res) => { ... })
 */
const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logSecurityEvent(req, 'AUTHZ_MISSING_USER', 'No user context');
      return res.status(401).json({
        success: false,
        message: 'User context missing',
      });
    }

    // Normalize requiredRoles to array
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Check if user's role is in required roles
    if (!roles.includes(req.user.role)) {
      logSecurityEvent(
        req,
        'AUTHZ_DENIED',
        `User ${req.user.username} (${req.user.role}) denied access to ${roles.join(',')}`
      );

      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions',
        requiredRole: roles,
        userRole: req.user.role,
      });
    }

    logSecurityEvent(
      req,
      'AUTHZ_GRANTED',
      `User ${req.user.username} (${req.user.role}) granted access`
    );
    next();
  };
};

/**
 * Log Security Event to Audit Log
 * 
 * Logs:
 * - Authentication events (token validation, expiry)
 * - Authorization events (role checks)
 * - Security incidents (missing tokens, invalid tokens)
 * 
 * Format: ISO Timestamp | Event Type | User | IP | Details
 */
const logSecurityEvent = (req, eventType, details) => {
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || 'anonymous';
  const username = req.user?.username || 'unknown';
  const ip = req.ip || req.connection.remoteAddress;
  const endpoint = `${req.method} ${req.path}`;

  const logEntry = `${timestamp} | SECURITY | ${eventType} | User: ${username} (${userId}) | IP: ${ip} | Endpoint: ${endpoint} | ${details}\n`;

  // Write to audit log
  const logDir = path.join(__dirname, '../../logs');
  const logFile = path.join(logDir, 'audit.log');

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write security event log:', err.message);
    }
  });

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${eventType}] ${username} | ${details}`);
  }
};

/**
 * Generate JWT Token
 * 
 * Creates a signed JWT with user information
 * 
 * @param {Object} user - User object with id, username, role
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {string} Signed JWT token
 */
const generateToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify JWT Token
 * 
 * Validates and decodes a JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  generateToken,
  verifyToken,
  logSecurityEvent,
  JWT_SECRET,
};

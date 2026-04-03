/**
 * GateGuard API - Server Entry Point
 * Module B: Authentication & RBAC
 * 
 * Implements:
 * - SQLite3 Database Connection
 * - Database Initialization (SQL Dump)
 * - JWT Authentication (/login, /isAuth)
 * - Role-Based Access Control Middleware
 * - Audit Logging with Morgan
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');

// Import middleware and utilities
const { authenticateJWT, authorizeRole } = require('./middleware/rbac');
const { loginUser, isAuthUser } = require('./routes/auth');

// Import route handlers
const usersRoutes = require('./routes/users');
const membersRoutes = require('./routes/members');
const guardsRoutes = require('./routes/guards');
const guestRequestsRoutes = require('./routes/guestRequests');
const guestsRoutes = require('./routes/guests');
const blacklistRoutes = require('./routes/blacklist');
const gatesRoutes = require('./routes/gates');
const logsRoutes = require('./routes/logs');
const qrRoutes = require('./routes/qr'); // Added QR routes

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize SQLite Database Connection
 * Connects to local database file: data.db
 */
// Use the externally-initialized GateGuard DB for Module B.
// The DB file `gategaurd.db` was created/seeded outside this module
// (per user request). Ignore `data.db` and connect directly to it.
const dbPath = path.join(__dirname, '../gategaurd.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

/**
 * Custom Morgan Stream for Audit Logging
 * Writes all HTTP requests and responses to logs/audit.log
 */
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const auditLogStream = fs.createWriteStream(
  path.join(logDirectory, 'audit.log'),
  { flags: 'a' }
);

// Custom format: includes timestamp, method, URL, status, response time, and user info
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('user-role', (req) => req.user?.role || 'none');

const auditFormat =
  ':date[iso] | :user-id (:user-role) | :method :url | Status: :status | Response: :response-time ms';

// Apply Morgan middleware for audit logging
app.use(morgan(auditFormat, { stream: auditLogStream }));

// Middleware: Parse JSON bodies
app.use(express.json());

// Middleware: Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// HEALTH CHECK & SERVER STATUS
// ============================================================================

/**
 * Health Check Endpoint
 * Returns server status and database connection info
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'GateGuard API - Module B',
    timestamp: new Date().toISOString(),
    database: 'SQLite3',
  });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * POST /login
 * Authenticate user and issue JWT token
 * 
 * Body:
 * {
 *   "username": "string",
 *   "password": "string"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "number",
 *     "username": "string",
 *     "role": "admin|user"
 *   }
 * }
 */
app.post('/login', (req, res) => {
  loginUser(req, res, db);
});

/**
 * GET /isAuth
 * Validate JWT token and return user info
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <token>"
 * }
 * 
 * Response (Success):
 * {
 *   "authenticated": true,
 *   "user": {
 *     "id": "number",
 *     "username": "string",
 *     "role": "admin|user"
 *   }
 * }
 * 
 * Response (Failure):
 * {
 *   "authenticated": false,
 *   "message": "Invalid or expired token"
 * }
 */
app.get('/isAuth', (req, res) => {
  isAuthUser(req, res);
});

// ============================================================================
// PROTECTED ROUTES EXAMPLE
// ============================================================================

/**
 * Admin-only endpoint
 * Demonstrates RBAC middleware usage
 */
app.get('/admin/dashboard', authenticateJWT, authorizeRole('admin'), (req, res) => {
  res.status(200).json({
    message: 'Welcome to Admin Dashboard',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

/**
 * User-accessible endpoint
 * Open to both admin and regular users
 */
app.get('/user/profile', authenticateJWT, (req, res) => {
  res.status(200).json({
    message: 'User Profile',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// USERS MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/users - List all users
 * GET /api/users/:id - Get user by ID
 * POST /api/users - Create new user
 * PUT /api/users/:id - Update user
 * DELETE /api/users/:id - Delete user
 */
app.get('/api/users', authenticateJWT, authorizeRole('admin'), (req, res) => {
  usersRoutes.getAllUsers(req, res, db);
});

app.get('/api/users/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  usersRoutes.getUserById(req, res, db);
});

app.post('/api/users', authenticateJWT, authorizeRole('admin'), (req, res) => {
  usersRoutes.createUser(req, res, db);
});

app.put('/api/users/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  usersRoutes.updateUser(req, res, db);
});

app.delete('/api/users/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  usersRoutes.deleteUser(req, res, db);
});

// ============================================================================
// MEMBERS MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/members - List all members
 * GET /api/members/:id - Get member by ID
 * POST /api/members - Create new member
 * PUT /api/members/:id - Update member
 * DELETE /api/members/:id - Delete member
 */
app.get('/api/members', authenticateJWT, (req, res) => {
  membersRoutes.getAllMembers(req, res, db);
});

app.get('/api/members/:id', authenticateJWT, (req, res) => {
  membersRoutes.getMemberById(req, res, db);
});

app.post('/api/members', authenticateJWT, authorizeRole('admin'), (req, res) => {
  membersRoutes.createMember(req, res, db);
});

app.put('/api/members/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  membersRoutes.updateMember(req, res, db);
});

app.delete('/api/members/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  membersRoutes.deleteMember(req, res, db);
});

// ============================================================================
// GUARDS MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/guards - List all guards
 * GET /api/guards/:id - Get guard by ID
 * POST /api/guards - Create new guard
 * PUT /api/guards/:id - Update guard
 * DELETE /api/guards/:id - Delete guard
 */
app.get('/api/guards', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guardsRoutes.getAllGuards(req, res, db);
});

app.get('/api/guards/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guardsRoutes.getGuardById(req, res, db);
});

app.post('/api/guards', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guardsRoutes.createGuard(req, res, db);
});

app.put('/api/guards/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guardsRoutes.updateGuard(req, res, db);
});

app.delete('/api/guards/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guardsRoutes.deleteGuard(req, res, db);
});

// ============================================================================
// GUEST REQUESTS MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/guest-requests - List all guest requests
 * GET /api/guest-requests/pending - List all pending guest requests
 * GET /api/guest-requests/member/:memberId - Get guest requests by member ID
 * GET /api/guest-requests/:id - Get guest request by ID
 * POST /api/guest-requests - Create new guest request
 * PUT /api/guest-requests/:id - Update guest request
 * DELETE /api/guest-requests/:id - Delete guest request
 * PATCH /api/guest-requests/:id/approve - Approve request (Admin only)
 * PATCH /api/guest-requests/:id/reject - Reject request (Admin only)
 */
app.get('/api/guest-requests', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.getAllGuestRequests(req, res, db);
});

app.get('/api/guest-requests/pending', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.getPendingGuestRequests(req, res, db);
});

app.get('/api/guest-requests/member/:personId', authenticateJWT, (req, res) => {
  guestRequestsRoutes.getGuestRequestsByPersonId(req, res, db);
});

app.get('/api/guest-requests/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.getGuestRequestById(req, res, db);
});

app.post('/api/guest-requests', authenticateJWT, (req, res) => {
  guestRequestsRoutes.createGuestRequest(req, res, db);
});

app.put('/api/guest-requests/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.updateGuestRequest(req, res, db);
});

app.delete('/api/guest-requests/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.deleteGuestRequest(req, res, db);
});

app.delete('/api/guest-requests/member/:id', authenticateJWT, (req, res) => {
  guestRequestsRoutes.deleteOwnGuestRequest(req, res, db);
});

app.patch('/api/guest-requests/:id/approve', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.approveGuestRequest(req, res, db);
});

app.patch('/api/guest-requests/:id/reject', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestRequestsRoutes.rejectGuestRequest(req, res, db);
});

// ============================================================================
// GUESTS MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/guests - List all guests
 * GET /api/guests/:id - Get guest by ID
 * POST /api/guests - Create new guest (from approved request)
 * DELETE /api/guests/:id - Remove guest
 */
app.get('/api/guests', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestsRoutes.getAllGuests(req, res, db);
});

app.get('/api/guests/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestsRoutes.getGuestById(req, res, db);
});

app.post('/api/guests', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestsRoutes.createGuest(req, res, db);
});

app.delete('/api/guests/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  guestsRoutes.deleteGuest(req, res, db);
});

// ============================================================================
// BLACKLIST MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/blacklist - List all blacklisted persons
 * GET /api/blacklist/:id - Get blacklist entry by ID
 * POST /api/blacklist - Add person to blacklist
 * PUT /api/blacklist/:id - Update blacklist entry
 * DELETE /api/blacklist/:id - Remove from blacklist
 */
app.get('/api/blacklist', authenticateJWT, authorizeRole('admin'), (req, res) => {
  blacklistRoutes.getAllBlacklist(req, res, db);
});

app.get('/api/blacklist/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  blacklistRoutes.getBlacklistById(req, res, db);
});

app.post('/api/blacklist', authenticateJWT, authorizeRole('admin'), (req, res) => {
  blacklistRoutes.addToBlacklist(req, res, db);
});

app.put('/api/blacklist/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  blacklistRoutes.updateBlacklist(req, res, db);
});

app.delete('/api/blacklist/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  blacklistRoutes.removeFromBlacklist(req, res, db);
});

// ============================================================================
// GATES MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/gates - List all gates
 * GET /api/gates/:id - Get gate by ID
 * PUT /api/gates/:id - Update gate
 * PATCH /api/gates/:id/open - Open gate
 * PATCH /api/gates/:id/close - Close gate
 */
app.get('/api/gates', authenticateJWT, authorizeRole('admin'), (req, res) => {
  gatesRoutes.getAllGates(req, res, db);
});

app.get('/api/gates/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  gatesRoutes.getGateById(req, res, db);
});

app.put('/api/gates/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  gatesRoutes.updateGate(req, res, db);
});

app.patch('/api/gates/:id/open', authenticateJWT, authorizeRole('admin'), (req, res) => {
  gatesRoutes.openGate(req, res, db);
});

app.patch('/api/gates/:id/close', authenticateJWT, authorizeRole('admin'), (req, res) => {
  gatesRoutes.closeGate(req, res, db);
});

// ============================================================================
// ACCESS LOGS ROUTES
// ============================================================================

/**
 * GET /api/logs/people - Get all access logs
 * GET /api/logs/people/:personId - Get logs for specific person
 * POST /api/logs/entry - Log entry
 * POST /api/logs/exit - Log exit
 */
app.get('/api/logs/people', (req, res) => {
  logsRoutes.getAllAccessLogs(req, res, db);
});

app.get('/api/logs/people/:personId', authenticateJWT, (req, res) => {
  logsRoutes.getPersonAccessLogs(req, res, db);
});

app.post('/api/logs/entry', authenticateJWT, (req, res) => {
  logsRoutes.logEntry(req, res, db);
});

app.post('/api/logs/exit', authenticateJWT, (req, res) => {
  logsRoutes.logExit(req, res, db);
});

app.post('/api/logs/scan', authenticateJWT, (req, res) => {
  logsRoutes.processQRScan(req, res, db);
});

app.get('/api/logs/peopleNeat', (req, res) => {
  logsRoutes.getAllAccessLogsNeat(req, res, db);
});

// ============================================================================
// QR CODE GENERATION ROUTES
// ============================================================================

/**
 * GET /api/qr/generate - Generate secure QR code for entry/exit
 */
app.get('/api/qr/generate', authenticateJWT, (req, res) => {
  qrRoutes.generateQR(req, res, db);
});

/**
 * 404 Handler
 * Catch all undefined routes
 */
app.use((req, res) => {
  auditLogStream.write(
    `${new Date().toISOString()} | 404 | NOT_FOUND | ${req.method} ${req.path}\n`
  );
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

/**
 * Global Error Handler
 * Catches all errors from routes and middleware
 */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  auditLogStream.write(
    `${new Date().toISOString()} | ERROR | ${err.message}\n`
  );

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   GateGuard API - Module B             ║');
  console.log('║   Authentication, RBAC System & CRUD   ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Database: ${dbPath}`);
  console.log(`📝 Audit Log: ${path.join(logDirectory, 'audit.log')}\n`);

  // Initialization is handled externally for Module B. We do not
  // run the SQL dump here because `gategaurd.db` is already seeded.
  // initializeDatabaseFromDump(); // intentionally disabled
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Database error:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    auditLogStream.end();
    console.log('✅ Audit log closed');
    process.exit(0);
  });
});

// Export for testing
module.exports = { app, db };

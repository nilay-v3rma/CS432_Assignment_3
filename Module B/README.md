# GateGuard API - Module B

**Database Course Assignment Module B**: Express.js + SQLite3 + JWT Authentication + RBAC

## 📋 Overview

This is a production-ready boilerplate for a secure REST API with:
- ✅ **JWT-based Authentication** - Token generation and validation
- ✅ **Role-Based Access Control (RBAC)** - Admin and User roles
- ✅ **SQLite3 Database** - Local file-based database
- ✅ **Audit Logging** - Complete request/security event logging
- ✅ **Database Initialization** - Automatic SQL dump execution on startup

## 🏗️ Project Structure

```
Module B/
├── app/
│   ├── server.js                 # Main Express application & entry point
│   ├── middleware/
│   │   └── rbac.js              # JWT & RBAC middleware
│   ├── routes/
│   │   └── auth.js              # Authentication endpoints (/login, /isAuth)
│   └── models/
│       └── db.js                # Database utilities & helpers
├── sql/
│   └── GateGuard_Almonds_Dump_File.sql  # Database schema & initial data
├── logs/
│   └── audit.log                # Audit trail of all requests
├── package.json
└── data.db                       # SQLite database (auto-created)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - HTTP server framework
- `sqlite3` - SQLite database driver
- `jsonwebtoken` - JWT creation & verification
- `bcryptjs` - Password hashing
- `morgan` - HTTP request logging

### 2. Start the Server

```bash
npm start
# Or with file watching in development:
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║   GateGuard API - Module B             ║
║   Authentication & RBAC System         ║
╚════════════════════════════════════════╝

🚀 Server running on http://localhost:3000
📋 Database: .../data.db
📝 Audit Log: .../logs/audit.log

✅ Connected to SQLite database
✅ Database initialized successfully with XX statements
```

## 🔐 Authentication Flow

### 1. Login (`POST /login`)

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwNDg3NjgwMCwiZXhwIjoxNzA1NDgxNjAwfQ.xxx",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@gateguard.local"
  }
}
```

### 2. Verify Authentication (`GET /isAuth`)

**Request:**
```
Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (Expired/Invalid Token - 403):**
```json
{
  "authenticated": false,
  "message": "Invalid token"
}
```

## 🔑 Default Credentials

After first run, default accounts are created:

| Username | Password  | Role  | Email                    |
|----------|-----------|-------|--------------------------|
| `admin`  | `admin123` | admin | admin@gateguard.local   |
| `user`   | `user123`  | user  | user@gateguard.local    |

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint      | Purpose                                    |
|--------|---------------|--------------------------------------------|
| GET    | `/health`     | Server health check                        |
| POST   | `/login`      | User authentication & token generation     |
| GET    | `/isAuth`     | Token validation & user info retrieval     |

### Protected Endpoints (Examples)

| Method | Endpoint                | Access     | Purpose              |
|--------|-------------------------|------------|----------------------|
| GET    | `/admin/dashboard`      | Admin only | Admin dashboard      |
| GET    | `/user/profile`         | Any user   | User profile info    |
| GET    | `/api/qr/generate`      | Any user   | Generate secure dynamically expiring QR token |

## 🛡️ RBAC Middleware Usage

### Protect a Route with Authentication

```javascript
app.get('/protected', authenticateJWT, (req, res) => {
  // req.user contains: { id, username, role }
  res.json({ message: 'Authenticated user only', user: req.user });
});
```

### Restrict to Admin Role

```javascript
app.delete('/admin/users/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### Allow Multiple Roles

```javascript
app.get('/data', authenticateJWT, authorizeRole(['admin', 'moderator']), (req, res) => {
  res.json({ message: 'Admin or Moderator access' });
});
```

## 📝 Audit Logging

All requests and security events are logged to `logs/audit.log`:

```
2024-01-09T15:45:22.123Z | admin (admin) | POST /login | Status: 200 | Response: 45 ms
2024-01-09T15:45:23.456Z | SECURITY | LOGIN_SUCCESS | User: admin (admin) | IP: ::1 | Endpoint: POST /login | Login successful
2024-01-09T15:45:24.789Z | admin (admin) | GET /admin/dashboard | Status: 200 | Response: 12 ms
2024-01-09T15:45:25.012Z | SECURITY | AUTHZ_GRANTED | User: admin (admin) | IP: ::1 | Endpoint: GET /admin/dashboard | granted access
```

## 🗄️ Database Schema

The SQL dump file (`GateGuard_Almonds_Dump_File.sql`) should contain:

**Minimum Required Tables:**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type VARCHAR(50),
  user_id INTEGER,
  ip_address VARCHAR(50),
  endpoint VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file (optional):

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-this-in-production
```

### JWT Secret

By default, uses: `your-secret-key-change-in-production`

**⚠️ IMPORTANT**: In production, set `JWT_SECRET` environment variable!

```bash
export JWT_SECRET=your-production-secret-key
npm start
```

## 📊 Testing the API

### Using cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Verify authentication
curl -X GET http://localhost:3000/isAuth \
  -H "Authorization: Bearer $TOKEN"

# 4. Access protected route
curl -X GET http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. **Create Login Request**
   - Method: `POST`
   - URL: `http://localhost:3000/login`
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Send and copy the `token` from response

2. **Create isAuth Request**
   - Method: `GET`
   - URL: `http://localhost:3000/isAuth`
   - Headers:
     ```
     Authorization: Bearer <paste-token-here>
     ```
   - Send

3. **Access Protected Endpoint**
   - Method: `GET`
   - URL: `http://localhost:3000/admin/dashboard`
   - Headers:
     ```
     Authorization: Bearer <paste-token-here>
     ```
   - Send

## 🚨 Error Handling

### Common Errors

| Status | Message                           | Cause                       | Solution                        |
|--------|-----------------------------------|-----------------------------|--------------------------------|
| 400    | Username and password required    | Missing credentials         | Include both fields in request  |
| 401    | Invalid username or password      | Wrong credentials           | Verify username and password    |
| 401    | Authorization token missing       | No Authorization header     | Include `Authorization` header  |
| 403    | Invalid token                     | Malformed/expired token     | Login again to get new token    |
| 403    | Access denied: insufficient...    | Wrong role for endpoint     | Use account with required role  |
| 404    | Endpoint not found                | Wrong URL                   | Check endpoint path             |
| 500    | An error occurred during login    | Server/database error       | Check server logs               |

## 📋 Code Comments & Documentation

All code includes:
- **JSDoc comments** for functions
- **Inline comments** explaining logic
- **Error messages** for debugging
- **Security event logging** for audit trail

## 🔒 Security Features

✅ **Password Hashing** - bcryptjs with salt rounds  
✅ **JWT Tokens** - Cryptographically signed, with expiration (7 days)  
✅ **RBAC** - Role-based access control middleware  
✅ **Audit Logging** - All requests and security events logged  
✅ **Input Validation** - Username and password required  
✅ **Error Handling** - Secure error messages (no internal details)  

## 📌 Notes & Constraints

- ❌ **No CRUD routes** for specific project tables (as per requirements)
- ✅ **Authentication-only focus** for /login and /isAuth endpoints
- ✅ **Reusable RBAC middleware** for other routes
- ✅ **Comprehensive audit logging** with Morgan + custom events
- ✅ **Database auto-initialization** from SQL dump

## 🔄 Extending the API

To add a new protected endpoint:

```javascript
// Example: Get all users (Admin only)
app.get('/admin/users', authenticateJWT, authorizeRole('admin'), (req, res, next) => {
  const query = 'SELECT id, username, role, email FROM users';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true, data: rows });
  });
});
```

## 🧪 Testing Database Queries

```javascript
// In app/models/db.js - Helper functions available:

// Execute SELECT query
dbQuery(db, 'SELECT * FROM users WHERE role = ?', ['admin'])
  .then(rows => console.log(rows))
  .catch(err => console.error(err));

// Get single row
dbGet(db, 'SELECT * FROM users WHERE id = ?', [1])
  .then(user => console.log(user))
  .catch(err => console.error(err));

// Execute INSERT/UPDATE/DELETE
dbRun(db, 'INSERT INTO users (username, role) VALUES (?, ?)', ['newuser', 'user'])
  .then(result => console.log('Inserted with ID:', result.id))
  .catch(err => console.error(err));
```

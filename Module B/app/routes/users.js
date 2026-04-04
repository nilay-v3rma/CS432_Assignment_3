/**
 * Users Management Routes
 * 
 * Provides CRUD endpoints for user management (Admin only)
 * - GET  /api/users          - List all users
 * - GET  /api/users/:id      - Get user by ID
 * - POST /api/users          - Create new user
 * - PUT  /api/users/:id      - Update user
 * - DELETE /api/users/:id    - Delete user
 */

const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * List all users (paginated)
 */
const getAllUsers = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = 'SELECT person_id, username, role, email, created_at FROM users LIMIT ? OFFSET ?';

  db.all(query, [limit, offset], (err, users) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: err.message,
      });
    }

    // Get total count
    db.get('SELECT COUNT(*) as count FROM users', (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get user count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages: Math.ceil(result.count / limit),
        },
      });
    });
  });
};

/**
 * GET /api/users/:id
 * Get user by ID
 */
const getUserById = (req, res, db) => {
  const { id } = req.params;

  const query = 'SELECT person_id as id, username, role, email, created_at FROM users WHERE person_id = ?';

  db.get(query, [id], (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: err.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  });
};

/**
 * POST /api/users
 * Create new user
 * 
 * Body:
 * {
 *   "username": "string (required, unique)",
 *   "password": "string (required, min 6 chars)",
 *   "email": "string (optional)",
 *   "role": "admin|user (default: user)"
 * }
 */
const createUser = (req, res, db) => {
  const { username, password, email, role } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  const userRole = role && ['admin', 'user'].includes(role) ? role : 'user';

  // Hash password
  bcrypt.hash(password, 10, (hashErr, passwordHash) => {
    if (hashErr) {
      console.error('Hash error:', hashErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to hash password',
      });
    }

    const insertQuery =
      'INSERT INTO users (username, password_hash, role, email, created_at) VALUES (?, ?, ?, ?, datetime("now"))';

    db.run(insertQuery, [username, passwordHash, userRole, email || null], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({
            success: false,
            message: 'Username already exists',
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Failed to create user',
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: this.lastID,
          username,
          email: email || null,
          role: userRole,
        },
      });
    });
  });
};

/**
 * PUT /api/users/:id
 * Update user
 * 
 * Body (all optional):
 * {
 *   "email": "string",
 *   "role": "admin|user",
 *   "password": "string (new password)"
 * }
 */
const updateUser = (req, res, db) => {
  const { id } = req.params;
  const { email, role, password } = req.body;

  // Check if user exists
  db.get('SELECT person_id FROM users WHERE person_id = ?', [id], (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role !== undefined && ['admin', 'user'].includes(role)) {
      updates.push('role = ?');
      values.push(role);
    }

    if (password !== undefined && password.length >= 6) {
      updates.push('password_hash = ?');
      values.push(password); // Will be hashed below
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    // Hash password if provided
    if (password) {
      bcrypt.hash(password, 10, (hashErr, passwordHash) => {
        if (hashErr) {
          return res.status(500).json({
            success: false,
            message: 'Failed to hash password',
          });
        }

        values[values.length - 2] = passwordHash;
        executeUpdate();
      });
    } else {
      executeUpdate();
    }

    function executeUpdate() {
      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE person_id = ?`;

      db.run(updateQuery, values, function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: err.message,
          });
        }

        res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: {
            id: parseInt(id),
            email: email,
            role: role,
          },
        });
      });
    }
  });
};

/**
 * DELETE /api/users/:id
 * Delete user
 */
const deleteUser = (req, res, db) => {
  const { id } = req.params;

  // Prevent deleting the default admin user
  if (id === '1') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete default admin user',
    });
  }

  const query = 'DELETE FROM users WHERE person_id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: parseInt(id),
      },
    });
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

/**
 * Guards Management Routes
 * 
 * Provides CRUD endpoints for guard management (Admin only)
 * - GET  /api/guards          - List all guards
 * - GET  /api/guards/:id      - Get guard by ID
 * - POST /api/guards          - Create new guard
 * - PUT  /api/guards/:id      - Update guard
 * - DELETE /api/guards/:id    - Delete guard
 */

/**
 * GET /api/guards
 * List all guards (paginated)
 */
const getAllGuards = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT g.guard_id, g.name, g.image, g.age, g.email, g.contact, g.shift, g.status, g.gate_id
    FROM guard g
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, guards) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guards',
        error: err.message,
      });
    }

    db.get('SELECT COUNT(*) as count FROM guard', (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get guard count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guards retrieved successfully',
        data: guards,
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
 * GET /api/guards/:id
 * Get guard by ID
 */
const getGuardById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT g.guard_id, g.name, g.image, g.age, g.email, g.contact, g.shift, g.status, g.gate_id
    FROM guard g
    WHERE g.guard_id = ?
  `;

  db.get(query, [id], (err, guard) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guard',
        error: err.message,
      });
    }

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: 'Guard not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guard retrieved successfully',
      data: guard,
    });
  });
};

/**
 * POST /api/guards
 * Create new guard
 * 
 * Body:
 * {
 *   "name": "string (required)",
 *   "email": "string (optional)",
 *   "contact": "string (optional)",
 *   "age": "number (optional)",
 *   "image": "string (optional, image path)",
 *   "shift": "morning|night (required)",
 *   "gate_id": "number (required)",
 *   "status": "active|inactive (default: active)"
 * }
 */
const createGuard = (req, res, db) => {
  const { name, email, contact, age, image, shift, gate_id, status } = req.body;

  // Validation
  if (!name || !shift || !gate_id) {
    return res.status(400).json({
      success: false,
      message: 'name, shift, and gate_id are required',
    });
  }

  if (!['morning', 'night'].includes(shift)) {
    return res.status(400).json({
      success: false,
      message: 'shift must be "morning" or "night"',
    });
  }

  const guardStatus = status && ['active', 'inactive'].includes(status) ? status : 'active';

  // Check if gate exists
  db.get('SELECT gate_id FROM gate WHERE gate_id = ?', [gate_id], (gateErr, gate) => {
    if (gateErr) {
      console.error('Database error:', gateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify gate',
      });
    }

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    const query =
      'INSERT INTO guard (name, image, age, email, contact, shift, status, gate_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    db.run(
      query,
      [name, image || null, age || null, email || null, contact || null, shift, guardStatus, gate_id],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to create guard',
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: 'Guard created successfully',
          data: {
            guard_id: this.lastID,
            name,
            email: email || null,
            contact: contact || null,
            age: age || null,
            image: image || null,
            shift,
            status: guardStatus,
            gate_id,
          },
        });
      }
    );
  });
};

/**
 * PUT /api/guards/:id
 * Update guard
 * 
 * Body (all optional):
 * {
 *   "name": "string",
 *   "email": "string",
 *   "contact": "string",
 *   "age": "number",
 *   "image": "string",
 *   "shift": "morning|night",
 *   "status": "active|inactive",
 *   "gate_id": "number"
 * }
 */
const updateGuard = (req, res, db) => {
  const { id } = req.params;
  const { name, email, contact, age, image, shift, status, gate_id } = req.body;

  // Check if guard exists
  db.get('SELECT * FROM guard WHERE guard_id = ?', [id], (err, guard) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guard',
      });
    }

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: 'Guard not found',
      });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (contact !== undefined) {
      updates.push('contact = ?');
      values.push(contact);
    }

    if (age !== undefined) {
      updates.push('age = ?');
      values.push(age);
    }

    if (image !== undefined) {
      updates.push('image = ?');
      values.push(image);
    }

    if (shift !== undefined) {
      if (!['morning', 'night'].includes(shift)) {
        return res.status(400).json({
          success: false,
          message: 'shift must be "morning" or "night"',
        });
      }
      updates.push('shift = ?');
      values.push(shift);
    }

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'status must be "active" or "inactive"',
        });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (gate_id !== undefined) {
      updates.push('gate_id = ?');
      values.push(gate_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    const updateQuery = `UPDATE guard SET ${updates.join(', ')} WHERE guard_id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to update guard',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guard updated successfully',
        data: {
          guard_id: parseInt(id),
          ...req.body,
        },
      });
    });
  });
};

/**
 * DELETE /api/guards/:id
 * Delete guard
 */
const deleteGuard = (req, res, db) => {
  const { id } = req.params;

  const query = 'DELETE FROM guard WHERE guard_id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete guard',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guard not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guard deleted successfully',
      data: {
        guard_id: parseInt(id),
      },
    });
  });
};

module.exports = {
  getAllGuards,
  getGuardById,
  createGuard,
  updateGuard,
  deleteGuard,
};

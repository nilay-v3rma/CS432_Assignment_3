/**
 * Blacklist Management Routes
 * 
 * Provides CRUD endpoints for blacklist management (Admin only)
 * - GET  /api/blacklist          - List all blacklisted persons
 * - GET  /api/blacklist/:id      - Get blacklist entry by ID
 * - POST /api/blacklist          - Add person to blacklist
 * - PUT  /api/blacklist/:id      - Update blacklist entry
 * - DELETE /api/blacklist/:id    - Remove from blacklist
 */

/**
 * GET /api/blacklist
 * List all blacklisted persons (paginated)
 */
const getAllBlacklist = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT bl.blacklist_id, bl.person_id, bl.name, bl.contact, bl.image, bl.expiry
    FROM blacklist bl
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, blacklisted) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blacklist',
        error: err.message,
      });
    }

    db.get('SELECT COUNT(*) as count FROM blacklist', (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get blacklist count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Blacklist retrieved successfully',
        data: blacklisted,
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
 * GET /api/blacklist/:id
 * Get blacklist entry by ID
 */
const getBlacklistById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT bl.blacklist_id, bl.person_id, bl.name, bl.contact, bl.image, bl.expiry
    FROM blacklist bl
    WHERE bl.blacklist_id = ?
  `;

  db.get(query, [id], (err, entry) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blacklist entry',
        error: err.message,
      });
    }

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blacklist entry retrieved successfully',
      data: entry,
    });
  });
};

/**
 * POST /api/blacklist
 * Add person to blacklist
 * 
 * Body:
 * {
 *   "person_id": "number (optional)",
 *   "name": "string (required)",
 *   "contact": "string (optional)",
 *   "image": "string (optional, image path)",
 *   "expiry": "YYYY-MM-DD (required)"
 * }
 */
const addToBlacklist = (req, res, db) => {
  const { person_id, name, contact, image, expiry } = req.body;

  // Validation
  if (!name || !expiry) {
    return res.status(400).json({
      success: false,
      message: 'name and expiry are required',
    });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
    return res.status(400).json({
      success: false,
      message: 'expiry must be in YYYY-MM-DD format',
    });
  }

  const query =
    'INSERT INTO blacklist (person_id, name, contact, image, expiry) VALUES (?, ?, ?, ?, ?)';

  db.run(
    query,
    [person_id || null, name, contact || null, image || null, expiry],
    function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to add person to blacklist',
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Person added to blacklist successfully',
        data: {
          blacklist_id: this.lastID,
          person_id: person_id || null,
          name,
          contact: contact || null,
          image: image || null,
          expiry,
        },
      });
    }
  );
};

/**
 * PUT /api/blacklist/:id
 * Update blacklist entry
 * 
 * Body (all optional):
 * {
 *   "name": "string",
 *   "contact": "string",
 *   "image": "string",
 *   "expiry": "YYYY-MM-DD"
 * }
 */
const updateBlacklist = (req, res, db) => {
  const { id } = req.params;
  const { name, contact, image, expiry } = req.body;

  // Check if entry exists
  db.get('SELECT * FROM blacklist WHERE blacklist_id = ?', [id], (err, entry) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blacklist entry',
      });
    }

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found',
      });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (contact !== undefined) {
      updates.push('contact = ?');
      values.push(contact);
    }

    if (image !== undefined) {
      updates.push('image = ?');
      values.push(image);
    }

    if (expiry !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        return res.status(400).json({
          success: false,
          message: 'expiry must be in YYYY-MM-DD format',
        });
      }
      updates.push('expiry = ?');
      values.push(expiry);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    const updateQuery = `UPDATE blacklist SET ${updates.join(', ')} WHERE blacklist_id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to update blacklist entry',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Blacklist entry updated successfully',
        data: {
          blacklist_id: parseInt(id),
          ...req.body,
        },
      });
    });
  });
};

/**
 * DELETE /api/blacklist/:id
 * Remove person from blacklist
 */
const removeFromBlacklist = (req, res, db) => {
  const { id } = req.params;

  const query = 'DELETE FROM blacklist WHERE blacklist_id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove from blacklist',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Person removed from blacklist successfully',
      data: {
        blacklist_id: parseInt(id),
      },
    });
  });
};

module.exports = {
  getAllBlacklist,
  getBlacklistById,
  addToBlacklist,
  updateBlacklist,
  removeFromBlacklist,
};

/**
 * Guest Requests Management Routes
 * 
 * Provides CRUD endpoints for guest request management
 * - GET  /api/guest-requests          - List all guest requests
 * - GET  /api/guest-requests/:id      - Get guest request by ID
 * - POST /api/guest-requests          - Create new guest request
 * - PUT  /api/guest-requests/:id      - Update guest request
 * - DELETE /api/guest-requests/:id    - Delete guest request
 * - PATCH /api/guest-requests/:id/approve - Approve request (Admin)
 * - PATCH /api/guest-requests/:id/reject  - Reject request (Admin)
 */

/**
 * GET /api/guest-requests/pending
 * List all pending guest requests
 */
const getPendingGuestRequests = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT gr.guest_request_id, gr.member_id, gr.name, gr.contact, gr.image, 
           gr.age, gr.email, gr.reason, gr.status, gr.exit_date, gr.vehicle_number
    FROM guest_request gr
    WHERE gr.status = 'pending'
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, requests) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending guest requests',
        error: err.message,
      });
    }

    const countQuery = "SELECT COUNT(*) as count FROM guest_request WHERE status = 'pending'";
    db.get(countQuery, [], (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get pending guest request count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Pending guest requests retrieved successfully',
        data: requests,
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
 * GET /api/guest-requests
 * List all guest requests (paginated, with optional status filter)
 * Query params: page, limit, status (pending|approved|rejected)
 */
const getAllGuestRequests = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let query = `
    SELECT gr.guest_request_id, gr.member_id, gr.name, gr.contact, gr.image, 
           gr.age, gr.email, gr.reason, gr.status, gr.exit_date, gr.vehicle_number
    FROM guest_request gr
  `;
  const params = [];

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query += ' WHERE gr.status = ?';
    params.push(status);
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, requests) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest requests',
        error: err.message,
      });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM guest_request';
    const countParams = [];
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get guest request count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guest requests retrieved successfully',
        data: requests,
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
 * GET /api/guest-requests/:id
 * Get guest request by ID
 */
const getGuestRequestById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT gr.guest_request_id, gr.member_id, gr.name, gr.contact, gr.image, 
           gr.age, gr.email, gr.reason, gr.status, gr.exit_date, gr.vehicle_number
    FROM guest_request gr
    WHERE gr.guest_request_id = ?
  `;

  db.get(query, [id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest request',
        error: err.message,
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guest request retrieved successfully',
      data: request,
    });
  });
};

/**
 * GET /api/guest-requests/member/:personId
 * Get guest requests by person ID (finds member_id first)
 */
const getGuestRequestsByPersonId = (req, res, db) => {
  const { personId } = req.params;

  const query = `
    SELECT gr.guest_request_id, gr.member_id, gr.name, gr.contact, gr.image, 
           gr.age, gr.email, gr.reason, gr.status, gr.exit_date, gr.vehicle_number
    FROM guest_request gr
    JOIN member m ON gr.member_id = m.member_id
    WHERE m.person_id = ?
  `;

  db.all(query, [personId], (err, requests) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest requests for member',
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guest requests retrieved successfully',
      data: requests,
    });
  });
};

/**
 * POST /api/guest-requests
 * Create new guest request
 * 
 * Body:
 * {
 *   "person_id": "string (required)",
 *   "name": "string (required)",
 *   "contact": "string (required)",
 *   "email": "string (optional)",
 *   "age": "number (optional, between 0-120)",
 *   "image": "string (optional, image path)",
 *   "reason": "string (required)",
 *   "exit_date": "YYYY-MM-DD (required)",
 *   "vehicle_number": "string (optional)"
 * }
 */
const createGuestRequest = (req, res, db) => {
  const { person_id, name, contact, email, age, image, reason, exit_date, vehicle_number } = req.body;

  // Validation
  if (!person_id || !name || !contact || !reason || !exit_date) {
    return res.status(400).json({
      success: false,
      message: 'person_id, name, contact, reason, and exit_date are required',
    });
  }

  if (age && (age < 0 || age > 120)) {
    return res.status(400).json({
      success: false,
      message: 'Age must be between 0 and 120',
    });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exit_date)) {
    return res.status(400).json({
      success: false,
      message: 'exit_date must be in YYYY-MM-DD format',
    });
  }

  // Check if member exists
  db.get('SELECT member_id FROM member WHERE person_id = ?', [person_id], (memberErr, member) => {
    if (memberErr) {
      console.error('Database error:', memberErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify member',
      });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const member_id = member.member_id;

    // Check for duplicate request
    const duplicateQuery = `
      SELECT guest_request_id FROM guest_request 
      WHERE member_id = ? AND name = ? AND contact = ? AND reason = ? AND exit_date = ?
    `;

    db.get(duplicateQuery, [member_id, name, contact, reason, exit_date], (dupErr, duplicate) => {
      if (dupErr) {
        console.error('Database error:', dupErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify request uniqueness',
        });
      }

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A guest request with these exact details already exists.',
        });
      }

      const query = `
        INSERT INTO guest_request (member_id, name, contact, image, age, email, reason, status, exit_date, vehicle_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `;

      db.run(
        query,
        [member_id, name, contact, image || null, age || null, email || null, reason, exit_date, vehicle_number || null],
        function (err) {
          if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
              success: false,
              message: 'Failed to create guest request',
              error: err.message,
            });
          }

          res.status(201).json({
            success: true,
            message: 'Guest request created successfully',
            data: {
              guest_request_id: this.lastID,
              member_id,
              name,
              contact,
              email: email || null,
              age: age || null,
              image: image || null,
              reason,
              status: 'pending',
              exit_date,
              vehicle_number: vehicle_number || null,
            },
          });
        }
      );
    });
  });
};

/**
 * PUT /api/guest-requests/:id
 * Update guest request
 * 
 * Body (all optional, can't update status via PUT):
 * {
 *   "name": "string",
 *   "contact": "string",
 *   "email": "string",
 *   "age": "number",
 *   "image": "string",
 *   "reason": "string",
 *   "exit_date": "YYYY-MM-DD",
 *   "vehicle_number": "string"
 * }
 */
const updateGuestRequest = (req, res, db) => {
  const { id } = req.params;
  const { name, contact, email, age, image, reason, exit_date, vehicle_number } = req.body;

  // Check if guest request exists
  db.get('SELECT * FROM guest_request WHERE guest_request_id = ?', [id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest request',
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
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

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (age !== undefined) {
      if (age < 0 || age > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 0 and 120',
        });
      }
      updates.push('age = ?');
      values.push(age);
    }

    if (image !== undefined) {
      updates.push('image = ?');
      values.push(image);
    }

    if (reason !== undefined) {
      updates.push('reason = ?');
      values.push(reason);
    }

    if (exit_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exit_date)) {
        return res.status(400).json({
          success: false,
          message: 'exit_date must be in YYYY-MM-DD format',
        });
      }
      updates.push('exit_date = ?');
      values.push(exit_date);
    }

    if (vehicle_number !== undefined) {
      updates.push('vehicle_number = ?');
      values.push(vehicle_number);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    const updateQuery = `UPDATE guest_request SET ${updates.join(', ')} WHERE guest_request_id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to update guest request',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guest request updated successfully',
        data: {
          guest_request_id: parseInt(id),
          ...req.body,
        },
      });
    });
  });
};

/**
 * DELETE /api/guest-requests/:id
 * Delete guest request
 */
const deleteGuestRequest = (req, res, db) => {
  const { id } = req.params;

  const query = 'DELETE FROM guest_request WHERE guest_request_id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete guest request',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guest request deleted successfully',
      data: {
        guest_request_id: parseInt(id),
      },
    });
  });
};

/**
 * DELETE /api/guest-requests/member/:id
 * Delete member's own pending guest request
 */
const deleteOwnGuestRequest = (req, res, db) => {
  const { id } = req.params;
  const person_id = req.query.person_id;

  if (!person_id) {
    return res.status(400).json({
      success: false,
      message: 'person_id query parameter is required',
    });
  }

  // First, verify the request meets conditions (is pending and belongs to the user)
  const verifyQuery = `
    SELECT gr.status 
    FROM guest_request gr
    JOIN member m ON gr.member_id = m.member_id
    WHERE gr.guest_request_id = ? AND m.person_id = ?
  `;

  db.get(verifyQuery, [id, person_id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify guest request',
        error: err.message,
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found or unauthorized',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be deleted',
      });
    }

    const deleteQuery = 'DELETE FROM guest_request WHERE guest_request_id = ?';

    db.run(deleteQuery, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete guest request',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guest request deleted successfully',
        data: {
          guest_request_id: parseInt(id),
        },
      });
    });
  });
};

/**
 * PATCH /api/guest-requests/:id/approve
 * Approve guest request (Admin only)
 */
const approveGuestRequest = (req, res, db) => {
  const { id } = req.params;

  // Check if guest request exists and is pending
  db.get('SELECT * FROM guest_request WHERE guest_request_id = ?', [id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest request',
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Guest request is already ${request.status}`,
      });
    }

    const updateQuery = 'UPDATE guest_request SET status = "approved" WHERE guest_request_id = ?';

    db.run(updateQuery, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to approve guest request',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guest request approved successfully',
        data: {
          guest_request_id: parseInt(id),
          status: 'approved',
        },
      });
    });
  });
};

/**
 * PATCH /api/guest-requests/:id/reject
 * Reject guest request (Admin only)
 */
const rejectGuestRequest = (req, res, db) => {
  const { id } = req.params;

  // Check if guest request exists and is pending
  db.get('SELECT * FROM guest_request WHERE guest_request_id = ?', [id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest request',
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Guest request is already ${request.status}`,
      });
    }

    const updateQuery = 'UPDATE guest_request SET status = "rejected" WHERE guest_request_id = ?';

    db.run(updateQuery, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to reject guest request',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guest request rejected successfully',
        data: {
          guest_request_id: parseInt(id),
          status: 'rejected',
        },
      });
    });
  });
};

module.exports = {
  getPendingGuestRequests,
  getAllGuestRequests,
  getGuestRequestById,
  getGuestRequestsByPersonId,
  createGuestRequest,
  updateGuestRequest,
  deleteGuestRequest,
  deleteOwnGuestRequest,
  approveGuestRequest,
  rejectGuestRequest,
};

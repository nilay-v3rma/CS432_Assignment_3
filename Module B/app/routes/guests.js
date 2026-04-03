/**
 * Guests Management Routes
 * 
 * Provides CRUD endpoints for guest management
 * - GET  /api/guests          - List all guests
 * - GET  /api/guests/:id      - Get guest by ID
 * - POST /api/guests          - Create new guest (from approved request)
 * - DELETE /api/guests/:id    - Remove guest
 */

/**
 * GET /api/guests
 * List all guests (paginated)
 */
const getAllGuests = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT g.guest_id, g.person_id, g.room_number, g.vehicle_id, g.guest_request_id,
           gr.name, gr.email, gr.contact
    FROM guest g
    LEFT JOIN guest_request gr ON g.guest_request_id = gr.guest_request_id
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, guests) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guests',
        error: err.message,
      });
    }

    db.get('SELECT COUNT(*) as count FROM guest', (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get guest count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Guests retrieved successfully',
        data: guests,
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
 * GET /api/guests/:id
 * Get guest by ID
 */
const getGuestById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT g.guest_id, g.person_id, g.room_number, g.vehicle_id, g.guest_request_id,
           gr.name, gr.email, gr.contact, gr.reason, gr.exit_date
    FROM guest g
    LEFT JOIN guest_request gr ON g.guest_request_id = gr.guest_request_id
    WHERE g.guest_id = ?
  `;

  db.get(query, [id], (err, guest) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest',
        error: err.message,
      });
    }

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guest retrieved successfully',
      data: guest,
    });
  });
};

/**
 * POST /api/guests
 * Create new guest (from approved request)
 * 
 * Body:
 * {
 *   "guest_request_id": "number (required, must be approved)",
 *   "room_number": "string (required)",
 *   "vehicle_id": "number (optional)"
 * }
 */
const createGuest = (req, res, db) => {
  const { guest_request_id, room_number, vehicle_id } = req.body;

  // Validation
  if (!guest_request_id || !room_number) {
    return res.status(400).json({
      success: false,
      message: 'guest_request_id and room_number are required',
    });
  }

  // Check if guest request exists and is approved
  db.get('SELECT * FROM guest_request WHERE guest_request_id = ?', [guest_request_id], (err, request) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify guest request',
      });
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Guest request not found',
      });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Guest request must be approved before creating guest',
      });
    }

    // Check if guest already exists for this request
    db.get('SELECT guest_id FROM guest WHERE guest_request_id = ?', [guest_request_id], (dupErr, existing) => {
      if (dupErr) {
        console.error('Database error:', dupErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to check existing guest',
        });
      }

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Guest already exists for this request',
        });
      }

      // Create person_info record first
      const personQuery = 'INSERT INTO person_info (age) VALUES (?)';

      db.run(personQuery, [request.age || null], function (personErr) {
        if (personErr) {
          console.error('Database error:', personErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to create person record',
          });
        }

        const personId = this.lastID;

        // Generate guest ID (GUEST_01, GUEST_02, etc.)
        db.get('SELECT COUNT(*) as count FROM guest', (countErr, result) => {
          if (countErr) {
            console.error('Database error:', countErr.message);
            return res.status(500).json({
              success: false,
              message: 'Failed to generate guest ID',
            });
          }

          const guestId = `GUEST_${String(result.count + 1).padStart(2, '0')}`;

          // Insert guest
          const guestQuery =
            'INSERT INTO guest (guest_id, person_id, room_number, vehicle_id, guest_request_id) VALUES (?, ?, ?, ?, ?)';

          db.run(
            guestQuery,
            [guestId, personId, room_number, vehicle_id || null, guest_request_id],
            function (guestErr) {
              if (guestErr) {
                console.error('Database error:', guestErr.message);
                return res.status(500).json({
                  success: false,
                  message: 'Failed to create guest',
                  error: guestErr.message,
                });
              }

              res.status(201).json({
                success: true,
                message: 'Guest created successfully',
                data: {
                  guest_id: guestId,
                  person_id: personId,
                  room_number,
                  vehicle_id: vehicle_id || null,
                  guest_request_id,
                  name: request.name,
                  email: request.email,
                  contact: request.contact,
                },
              });
            }
          );
        });
      });
    });
  });
};

/**
 * DELETE /api/guests/:id
 * Delete guest
 */
const deleteGuest = (req, res, db) => {
  const { id } = req.params;

  // Check if guest exists
  db.get('SELECT person_id FROM guest WHERE guest_id = ?', [id], (err, guest) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest',
      });
    }

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
      });
    }

    // Delete guest record
    db.run('DELETE FROM guest WHERE guest_id = ?', [id], function (deleteErr) {
      if (deleteErr) {
        console.error('Database error:', deleteErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete guest',
          error: deleteErr.message,
        });
      }

      // Also delete the associated person_info record
      db.run('DELETE FROM person_info WHERE person_id = ?', [guest.person_id], (personErr) => {
        if (personErr) {
          console.warn('Warning: Failed to delete person_info record:', personErr.message);
        }

        res.status(200).json({
          success: true,
          message: 'Guest deleted successfully',
          data: {
            guest_id: id,
          },
        });
      });
    });
  });
};

module.exports = {
  getAllGuests,
  getGuestById,
  createGuest,
  deleteGuest,
};

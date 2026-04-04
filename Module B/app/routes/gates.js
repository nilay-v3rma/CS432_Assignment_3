/**
 * Gates Management Routes
 * 
 * Provides CRUD endpoints for gate management (Admin only)
 * - GET  /api/gates          - List all gates
 * - GET  /api/gates/:id      - Get gate by ID
 * - PUT  /api/gates/:id      - Update gate
 * - PATCH /api/gates/:id/open  - Open gate
 * - PATCH /api/gates/:id/close - Close gate
 */

/**
 * GET /api/gates
 * List all gates
 */
const getAllGates = (req, res, db) => {
  const query = `
    SELECT g.gate_id, g.status, g.opening_time, g.closing_time
    FROM gate g
  `;

  db.all(query, [], (err, gates) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch gates',
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gates retrieved successfully',
      data: gates,
      count: gates.length,
    });
  });
};

/**
 * GET /api/gates/:id
 * Get gate by ID
 */
const getGateById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT g.gate_id, g.status, g.opening_time, g.closing_time
    FROM gate g
    WHERE g.gate_id = ?
  `;

  db.get(query, [id], (err, gate) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch gate',
        error: err.message,
      });
    }

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gate retrieved successfully',
      data: gate,
    });
  });
};

/**
 * PUT /api/gates/:id
 * Update gate details
 * 
 * Body (all optional):
 * {
 *   "opening_time": "HH:MM:SS",
 *   "closing_time": "HH:MM:SS",
 *   "status": "open|closed"
 * }
 */
const updateGate = (req, res, db) => {
  const { id } = req.params;
  const { opening_time, closing_time, status } = req.body;

  // Check if gate exists
  db.get('SELECT * FROM gate WHERE gate_id = ?', [id], (err, gate) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch gate',
      });
    }

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    const updates = [];
    const values = [];

    if (opening_time !== undefined) {
      if (!/^\d{2}:\d{2}:\d{2}$/.test(opening_time)) {
        return res.status(400).json({
          success: false,
          message: 'opening_time must be in HH:MM:SS format',
        });
      }
      updates.push('opening_time = ?');
      values.push(opening_time);
    }

    if (closing_time !== undefined) {
      if (!/^\d{2}:\d{2}:\d{2}$/.test(closing_time)) {
        return res.status(400).json({
          success: false,
          message: 'closing_time must be in HH:MM:SS format',
        });
      }
      updates.push('closing_time = ?');
      values.push(closing_time);
    }

    if (status !== undefined) {
      if (!['open', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'status must be "open" or "closed"',
        });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    const updateQuery = `UPDATE gate SET ${updates.join(', ')} WHERE gate_id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to update gate',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gate updated successfully',
        data: {
          gate_id: parseInt(id),
          ...req.body,
        },
      });
    });
  });
};

/**
 * PATCH /api/gates/:id/open
 * Open gate
 */
const openGate = (req, res, db) => {
  const { id } = req.params;

  // Check if gate exists
  db.get('SELECT * FROM gate WHERE gate_id = ?', [id], (err, gate) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch gate',
      });
    }

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    if (gate.status === 'open') {
      return res.status(400).json({
        success: false,
        message: 'Gate is already open',
      });
    }

    const updateQuery = 'UPDATE gate SET status = "open" WHERE gate_id = ?';

    db.run(updateQuery, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to open gate',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gate opened successfully',
        data: {
          gate_id: parseInt(id),
          status: 'open',
          timestamp: new Date().toISOString(),
        },
      });
    });
  });
};

/**
 * PATCH /api/gates/:id/close
 * Close gate
 */
const closeGate = (req, res, db) => {
  const { id } = req.params;

  // Check if gate exists
  db.get('SELECT * FROM gate WHERE gate_id = ?', [id], (err, gate) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch gate',
      });
    }

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    if (gate.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Gate is already closed',
      });
    }

    const updateQuery = 'UPDATE gate SET status = "closed" WHERE gate_id = ?';

    db.run(updateQuery, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to close gate',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gate closed successfully',
        data: {
          gate_id: parseInt(id),
          status: 'closed',
          timestamp: new Date().toISOString(),
        },
      });
    });
  });
};

module.exports = {
  getAllGates,
  getGateById,
  updateGate,
  openGate,
  closeGate,
};

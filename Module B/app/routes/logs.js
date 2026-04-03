/**
 * Access Logs Management Routes
 * 
 * Provides endpoints for access logging and retrieval
 * - GET  /api/logs/people              - Get all access logs (paginated)
 * - GET  /api/logs/people/:personId    - Get logs for specific person
 * - POST /api/logs/entry               - Log entry (Guard only)
 * - POST /api/logs/exit                - Log exit (Guard only)
 */

/**
 * GET /api/logs/people
 * Get all access logs (paginated, with optional filters)
 * Query params: page, limit, gate_id, person_id, startDate, endDate
 */
const getAllAccessLogs = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { gate_id, person_id, startDate, endDate } = req.query;

  let query = `
    SELECT pl.log_id, pl.gate_id, pl.person_id, pl.vehicle_id, pl.log_type, pl.time,
           g.status as gate_status
    FROM people_log pl
    LEFT JOIN gate g ON pl.gate_id = g.gate_id
    WHERE 1=1
  `;
  const params = [];

  if (gate_id) {
    query += ' AND pl.gate_id = ?';
    params.push(gate_id);
  }

  if (person_id) {
    query += ' AND pl.person_id = ?';
    params.push(person_id);
  }

  if (startDate) {
    query += ' AND date(pl.time) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date(pl.time) <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY pl.time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, logs) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch access logs',
        error: err.message,
      });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM people_log WHERE 1=1';
    const countParams = [];

    if (gate_id) {
      countQuery += ' AND gate_id = ?';
      countParams.push(gate_id);
    }

    if (person_id) {
      countQuery += ' AND person_id = ?';
      countParams.push(person_id);
    }

    if (startDate) {
      countQuery += ' AND date(time) >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND date(time) <= ?';
      countParams.push(endDate);
    }

    db.get(countQuery, countParams, (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get log count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Access logs retrieved successfully',
        data: logs,
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

const getAllAccessLogsNeat = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      pl.log_id,
      COALESCE(m.name, v.name) AS person_name,
      COALESCE(m.contact, v.contact) AS person_contact,
        pl.time,
        pl.log_type AS log_type,
      vh.vehicle_number AS vehicle,
      pl.gate_id AS gate,
      pl.log_type,
      g.status AS gate_status
    FROM people_log pl
    LEFT JOIN gate g ON pl.gate_id = g.gate_id
    LEFT JOIN member m ON pl.person_id = m.person_id
    LEFT JOIN visitor v ON pl.person_id = v.person_id
    LEFT JOIN vehicle vh ON pl.vehicle_id = vh.vehicle_id
    ORDER BY pl.time DESC LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, logs) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch access logs',
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Access logs retrieved successfully',
      data: logs,
      pagination: {
        page,
        limit,
        total: null, // Total count not provided in this endpoint
        totalPages: null,
      },
    });
  });
};
/**
 * GET /api/logs/people/:personId
 * Get access logs for specific person
 * Query params: page, limit, gate_id, startDate, endDate
 */
const getPersonAccessLogs = (req, res, db) => {
  const { personId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { gate_id, startDate, endDate } = req.query;

  let query = `
    SELECT pl.log_id, pl.gate_id, pl.person_id, pl.vehicle_id, pl.log_type, pl.time,
           g.status as gate_status
    FROM people_log pl
    LEFT JOIN gate g ON pl.gate_id = g.gate_id
    WHERE pl.person_id = ?
  `;
  const params = [personId];

  if (gate_id) {
    query += ' AND pl.gate_id = ?';
    params.push(gate_id);
  }

  if (startDate) {
    query += ' AND date(pl.time) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date(pl.time) <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY pl.time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, logs) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch person logs',
        error: err.message,
      });
    }

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No logs found for this person',
      });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM people_log WHERE person_id = ?';
    const countParams = [personId];

    if (gate_id) {
      countQuery += ' AND gate_id = ?';
      countParams.push(gate_id);
    }

    if (startDate) {
      countQuery += ' AND date(time) >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND date(time) <= ?';
      countParams.push(endDate);
    }

    db.get(countQuery, countParams, (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get log count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Person access logs retrieved successfully',
        data: logs,
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
 * POST /api/logs/entry
 * Log entry - Record when a person enters the facility
 * 
 * Body:
 * {
 *   "gate_id": "number (required)",
 *   "person_id": "number (required)",
 *   "vehicle_id": "number (optional)"
 * }
 */
const logEntry = (req, res, db) => {
  const { gate_id, person_id, vehicle_id } = req.body;

  // Validation
  if (!gate_id || !person_id) {
    return res.status(400).json({
      success: false,
      message: 'gate_id and person_id are required',
    });
  }

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

    // Check if person exists
    db.get('SELECT person_id FROM person_info WHERE person_id = ?', [person_id], (personErr, person) => {
      if (personErr) {
        console.error('Database error:', personErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify person',
        });
      }

      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Person not found',
        });
      }

      const query =
        'INSERT INTO people_log (gate_id, person_id, vehicle_id, log_type) VALUES (?, ?, ?, "entry")';

      db.run(query, [gate_id, person_id, vehicle_id || null], function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to log entry',
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: 'Entry logged successfully',
          data: {
            log_id: this.lastID,
            gate_id,
            person_id,
            vehicle_id: vehicle_id || null,
            log_type: 'entry',
            time: new Date().toISOString(),
          },
        });
      });
    });
  });
};

/**
 * POST /api/logs/exit
 * Log exit - Record when a person exits the facility
 * 
 * Body:
 * {
 *   "log_id": "number (required - the entry log ID)"
 * }
 */
const logExit = (req, res, db) => {
  const { log_id } = req.body;

  // Validation
  if (!log_id) {
    return res.status(400).json({
      success: false,
      message: 'log_id is required',
    });
  }

  // Check if log entry exists and exit_time is not already set
  db.get('SELECT * FROM people_log WHERE log_id = ?', [log_id], (err, log) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch log entry',
      });
    }

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log entry not found',
      });
    }

    if (log.exit_time) {
      return res.status(400).json({
        success: false,
        message: 'Exit already logged for this entry',
      });
    }

    const updateQuery = 'UPDATE people_log SET exit_time = datetime("now") WHERE log_id = ?';

    db.run(updateQuery, [log_id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to log exit',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Exit logged successfully',
        data: {
          log_id: parseInt(log_id),
          exit_time: new Date().toISOString(),
        },
      });
    });
  });
};

/**
 * POST /api/logs/scan
 * Process a QR code scan event
 * 
 * Body:
 * {
 *   "qr_info": "string",
 *   "gate_id": "number"
 * }
 */
const processQRScan = (req, res, db) => {
  const { qr_info, gate_id } = req.body;

  if (!qr_info || !gate_id) {
    return res.status(400).json({
      success: false,
      message: 'qr_info and gate_id are required',
    });
  }

  // Find QR code and check valid_till
  db.get('SELECT * FROM qr_code WHERE qr_info = ?', [qr_info], (err, row) => {
    if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    
    // Check valid_till vs current time
    if (new Date(row.valid_till) < new Date()) {
      return res.status(403).json({ success: false, message: 'QR Code Expired' });
    }

    const newFlag = row.in_campus_flag ? 0 : 1;
    const logType = newFlag ? 'entry' : 'exit';

    // Toggle in_campus_flag
    db.run('UPDATE qr_code SET in_campus_flag = ? WHERE qr_info = ?', [newFlag, qr_info], (updateErr) => {
      if (updateErr) {
          console.error('Database update error:', updateErr.message);
          return res.status(500).json({ success: false, message: 'Failed to update QR status' });
      }
      
      // Check for vehicle
      db.get('SELECT vehicle_id FROM vehicle WHERE person_id = ? LIMIT 1', [row.person_id], (vehErr, vehRow) => {
        const vehicle_id = vehRow ? vehRow.vehicle_id : null;
        
        // Insert into people_log
        const query = 'INSERT INTO people_log (gate_id, person_id, vehicle_id, log_type) VALUES (?, ?, ?, ?)';
        db.run(query, [gate_id, row.person_id, vehicle_id, logType], function(logErr) {
          if (logErr) {
            console.error('Database insert error:', logErr.message);
            return res.status(500).json({ success: false, message: 'Failed to log event' });
          }
          
          return res.status(200).json({ 
              success: true, 
              message: `Access Granted: ${logType.toUpperCase()} marked successfully`,
              data: {
                  log_id: this.lastID,
                  person_id: row.person_id,
                  log_type: logType,
                  vehicle_id
              }
          });
        });
      });
    });
  });
};

module.exports = {
  getAllAccessLogs,
  getAllAccessLogsNeat,
  getPersonAccessLogs,
  logEntry,
  logExit,
  processQRScan,
};

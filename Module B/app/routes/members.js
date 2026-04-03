/**
 * Members Management Routes
 * 
 * Provides CRUD endpoints for member management
 * - GET  /api/members          - List all members
 * - GET  /api/members/:id      - Get member by ID
 * - POST /api/members          - Create new member
 * - PUT  /api/members/:id      - Update member
 * - DELETE /api/members/:id    - Delete member
 */

/**
 * GET /api/members
 * List all members (paginated)
 */
const getAllMembers = (req, res, db) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT m.member_id, m.person_id, m.name, m.image, m.age, m.email, m.contact
    FROM member m
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, members) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch members',
        error: err.message,
      });
    }

    db.get('SELECT COUNT(*) as count FROM member', (countErr, result) => {
      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get member count',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Members retrieved successfully',
        data: members,
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
 * GET /api/members/:id
 * Get member by ID
 */
const getMemberById = (req, res, db) => {
  const { id } = req.params;

  const query = `
    SELECT m.member_id, m.person_id, m.name, m.image, m.age, m.email, m.contact
    FROM member m
    WHERE m.member_id = ?
  `;

  db.get(query, [id], (err, member) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch member',
        error: err.message,
      });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member retrieved successfully',
      data: member,
    });
  });
};

/**
 * POST /api/members
 * Create new member
 * 
 * Body:
 * {
 *   "member_id": "string (required, unique, e.g., IITGN_01)",
 *   "name": "string (required)",
 *   "email": "string (required, unique)",
 *   "contact": "string (required, unique)",
 *   "image": "string (optional, image path)",
 *   "age": "number (optional, between 16-100)"
 * }
 */
const createMember = (req, res, db) => {
  const { member_id, name, email, contact, image, age } = req.body;

  // Validation
  if (!member_id || !name || !email || !contact) {
    return res.status(400).json({
      success: false,
      message: 'member_id, name, email, and contact are required',
    });
  }

  if (age && (age < 16 || age > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Age must be between 16 and 100',
    });
  }

  // First, insert into person_info table
  const personQuery = 'INSERT INTO person_info (age) VALUES (?)';

  db.run(personQuery, [age || null], function (personErr) {
    if (personErr) {
      console.error('Database error:', personErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create person record',
      });
    }

    const personId = this.lastID;

    // Then insert into member table
    const memberQuery =
      'INSERT INTO member (member_id, person_id, name, image, age, email, contact) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.run(
      memberQuery,
      [member_id, personId, name, image || null, age || null, email, contact],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
              success: false,
              message: 'Member ID, email, or contact already exists',
            });
          }
          return res.status(500).json({
            success: false,
            message: 'Failed to create member',
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: 'Member created successfully',
          data: {
            member_id,
            person_id: personId,
            name,
            email,
            contact,
            age: age || null,
            image: image || null,
          },
        });
      }
    );
  });
};

/**
 * PUT /api/members/:id
 * Update member
 * 
 * Body (all optional):
 * {
 *   "name": "string",
 *   "email": "string",
 *   "contact": "string",
 *   "image": "string",
 *   "age": "number"
 * }
 */
const updateMember = (req, res, db) => {
  const { id } = req.params;
  const { name, email, contact, image, age } = req.body;

  // Check if member exists
  db.get('SELECT * FROM member WHERE member_id = ?', [id], (err, member) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch member',
      });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
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

    if (image !== undefined) {
      updates.push('image = ?');
      values.push(image);
    }

    if (age !== undefined) {
      if (age < 16 || age > 100) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 16 and 100',
        });
      }
      updates.push('age = ?');
      values.push(age);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(id);

    const updateQuery = `UPDATE member SET ${updates.join(', ')} WHERE member_id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({
            success: false,
            message: 'Email or contact already exists',
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Failed to update member',
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        data: {
          member_id: id,
          ...req.body,
        },
      });
    });
  });
};

/**
 * DELETE /api/members/:id
 * Delete member
 */
const deleteMember = (req, res, db) => {
  const { id } = req.params;

  const query = 'DELETE FROM member WHERE member_id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete member',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
      data: {
        member_id: id,
      },
    });
  });
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};

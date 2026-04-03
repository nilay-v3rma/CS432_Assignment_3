const jwt = require('jsonwebtoken');

const QR_SECRET = process.env.QR_SECRET || 'qr-secret-key-gate-guard-exclusive';

const generateQR = (req, res, db) => {
  const person_id = req.user.id;

  if (!person_id) {
    return res.status(400).json({ error: 'Person ID missing from token' });
  }

  db.get('SELECT qr_info FROM qr_code WHERE person_id = ?', [person_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'QR Code not found for this person' });
    
    return res.status(200).json({ qr_info: row.qr_info });
  });
};

module.exports = { generateQR };

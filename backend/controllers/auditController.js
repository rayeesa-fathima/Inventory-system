const db = require('../config/db');

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, entity_type, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (action) { where += ' AND action = ?'; params.push(action); }
    if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
    if (search) {
      where += ' AND (user_name LIKE ? OR action LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM audit_logs ${where}`, params);
    const total = countResult[0].total;

    const [logs] = await db.query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, entity_type, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (action) { where += ' AND action = ?'; params.push(action); }
    if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
    if (search) {
      where += ' AND (user_name LIKE ? OR action LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM audit_logs ${where}`, params);
    const total = countResult[0].total;

    const [logs] = await db.query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
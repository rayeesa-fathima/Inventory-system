const db = require('../config/db');
const { logAction } = require('../helpers/auditLogger');

exports.adjustStock = async (req, res) => {
  try {
    const { product_id, change_type, quantity, notes } = req.body;
    if (!['add', 'reduce'].includes(change_type)) {
      return res.status(400).json({ message: 'change_type must be "add" or "reduce"' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be positive' });
    }

    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!products.length) return res.status(404).json({ message: 'Product not found' });

    const product = products[0];
    const qtyBefore = product.stock_quantity;
    const qtyAfter = change_type === 'add' ? qtyBefore + parseInt(quantity) : qtyBefore - parseInt(quantity);

    if (qtyAfter < 0) {
      return res.status(400).json({ message: 'Stock cannot go below zero' });
    }

    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [qtyAfter, product_id]);
    await db.query(
      `INSERT INTO stock_history (product_id, change_type, quantity_change, quantity_before, quantity_after, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_id, change_type, change_type === 'add' ? quantity : -quantity, qtyBefore, qtyAfter, notes, req.user.id]
    );

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      action: 'STOCK_ADJUSTED',
      entityType: 'product',
      entityId: product_id,
      details: { productName: product.name, changeType: change_type, quantityChange: quantity, before: qtyBefore, after: qtyAfter },
      ipAddress: req.ip
    });

    res.json({ message: 'Stock updated successfully', new_stock: qtyAfter });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStockHistory = async (req, res) => {
  try {
    const { product_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (product_id) { where += ' AND sh.product_id = ?'; params.push(product_id); }

    const [rows] = await db.query(
      `SELECT sh.*, p.name as product_name, u.name as created_by_name
       FROM stock_history sh
       JOIN products p ON sh.product_id = p.id
       LEFT JOIN users u ON sh.created_by = u.id
       ${where}
       ORDER BY sh.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
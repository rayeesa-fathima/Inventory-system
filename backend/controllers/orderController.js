const db = require('../config/db');
const { logAction } = require('../helpers/auditLogger');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
};

// GET all orders with filters
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
  
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedSortFields = ['created_at', 'order_number', 'customer_name', 'total_amount', 'status'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`, params
    );
    const total = countResult[0].total;

    const [orders] = await db.query(
      `SELECT o.*, u.name as created_by_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       ${whereClause}
       ORDER BY o.${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single order with items
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query(
      `SELECT o.*, u.name as created_by_name FROM orders o
       LEFT JOIN users u ON o.created_by = u.id WHERE o.id = ?`,
      [id]
    );
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });

    const [items] = await db.query(
      `SELECT oi.*, p.name as product_name, p.sku FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [id]
    );

    res.json({ ...orders[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create order (with transaction)
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_name, customer_email, notes, items } = req.body;

    if (!customer_name || !items || !items.length) {
      return res.status(400).json({ message: 'Customer name and at least one item required' });
    }

    // Validate stock for all items
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, stock, price, status FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (!products.length) {
        await connection.rollback();
        return res.status(400).json({ message: `Product ID ${item.product_id} not found` });
      }
      const product = products[0];
      if (product.status === 'inactive') {
        await connection.rollback();
        return res.status(400).json({ message: `Product "${product.name}" is inactive` });
      }
      if (product.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`
        });
      }
    }

    // Calculate total and create order
    let totalAmount = 0;
    const orderNumber = generateOrderNumber();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, notes, status, total_amount, created_by)
       VALUES (?, ?, ?, ?, 'Pending', 0, ?)`,
      [orderNumber, customer_name, customer_email, notes, req.user.id]
    );
    const orderId = orderResult.insertId;

    // Insert items and deduct stock
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT price, stock FROM products WHERE id = ?', [item.product_id]
      );
      const product = products[0];
      const unitPrice = product.price;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, unitPrice, itemTotal]
      );

      const qtyBefore = product.stock;
      const qtyAfter = qtyBefore - item.quantity;

      await connection.query(
        'UPDATE products SET stock= ? WHERE id = ?',
        [qtyAfter, item.product_id]
      );

      await connection.query(
        `INSERT INTO stock_history (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id, created_by)
         VALUES (?, 'order_deduct', ?, ?, ?, ?, ?)`,
        [item.product_id, -item.quantity, qtyBefore, qtyAfter, orderId, req.user.id]
      );
    }

    // Update total
    await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);

    await connection.commit();

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: orderId,
      details: { orderNumber, customerName: customer_name, totalAmount },
      ipAddress: req.ip
    });

    res.status(201).json({ message: 'Order created successfully', orderId, orderNumber });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

// PATCH update order status
exports.updateOrderStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Staff can only update to Confirmed or Processing
    if (req.user.role === 'staff' && !['Confirmed','Processing'].includes(status)) {
      return res.status(403).json({ message: 'Staff can only set status to Confirmed or Processing' });
    }

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];

    if (order.status === 'Cancelled' && status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    const previousStatus = order.status;

    // Handle cancellation stock restore
    if (status === 'Cancelled' && order.cancel_stock_restored === 0) {
      const [items] = await connection.query(
        'SELECT * FROM order_items WHERE order_id = ?', [id]
      );

      for (const item of items) {
        const [products] = await connection.query(
          'SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]
        );
        const qtyBefore = products[0].stock;
        const qtyAfter = qtyBefore + item.quantity;

        await connection.query(
          'UPDATE products SET stock = ? WHERE id = ?',
          [qtyAfter, item.product_id]
        );

        await connection.query(
          `INSERT INTO stock_history (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id, created_by)
           VALUES (?, 'order_restore', ?, ?, ?, ?, ?)`,
          [item.product_id, item.quantity, qtyBefore, qtyAfter, id, req.user.id]
        );
      }

      await connection.query(
        'UPDATE orders SET status = ?, cancelled_at = NOW(), cancel_stock_restored = 1 WHERE id = ?',
        [status, id]
      );
    } else {
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }

    await connection.commit();

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'order',
      entityId: parseInt(id),
      details: { from: previousStatus, to: status, orderNumber: order.order_number },
      ipAddress: req.ip
    });

    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};
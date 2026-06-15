// Add this to your existing dashboard controller or create backend/controllers/dashboardController.js

exports.getDashboardStats = async (req, res) => {
  try {
    const [[productStats]] = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN stock_quantity <= low_stock_limit THEN 1 END) as low_stock_count
      FROM products
    `);

    const [[orderStats]] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_amount END), 0) as total_revenue
      FROM orders
    `);

    const [recentOrders] = await db.query(`
      SELECT o.*, u.name as created_by_name 
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC LIMIT 5
    `);

    const [lowStockProducts] = await db.query(`
      SELECT id, name, sku, stock_quantity, low_stock_limit
      FROM products
      WHERE stock_quantity <= low_stock_limit AND status = 'active'
      ORDER BY stock_quantity ASC LIMIT 5
    `);

    res.json({
      total_products: productStats.total_products,
      active_products: productStats.active_products,
      low_stock_count: productStats.low_stock_count,
      total_orders: orderStats.total_orders,
      pending_orders: orderStats.pending_orders,
      total_revenue: parseFloat(orderStats.total_revenue),
      recent_orders: recentOrders,
      low_stock_products: lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
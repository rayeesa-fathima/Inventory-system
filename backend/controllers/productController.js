const db = require("../config/db");

// ======================
// GET ALL PRODUCTS
// ======================
const getProducts = async (req, res) => {
  try {
    const [result] = await db.query("SELECT * FROM products");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching products",
    });
  }
};
// ======================
// ADD PRODUCT
// ======================
const addProduct = (req, res) => {
  const {
    name,
    sku,
    category,
    price,
    stock,
    low_stock_limit,
    status,
  } = req.body;

  const sql = `
    INSERT INTO products
    (
      name,
      sku,
      category,
      price,
      stock,
      low_stock_limit,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      sku,
      category,
      price,
      stock,
      low_stock_limit,
      status,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Error adding product",
        });
      }

      res.json({
        success: true,
        message: "Product Added Successfully",
        productId: result.insertId,
      });
    }
  );
};

// ======================
// UPDATE PRODUCT
// ======================
const updateProduct = (req, res) => {
  const { id } = req.params;

  const {
    name,
    sku,
    category,
    price,
    stock,
    low_stock_limit,
    status,
  } = req.body;

  const sql = `
    UPDATE products
    SET
      name = ?,
      sku = ?,
      category = ?,
      price = ?,
      stock = ?,
      low_stock_limit = ?,
      status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      name,
      sku,
      category,
      price,
      stock,
      low_stock_limit,
      status,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Error updating product",
        });
      }

      res.json({
        success: true,
        message: "Product Updated Successfully",
      });
    }
  );
};

// ======================
// DELETE PRODUCT
// ======================
const deleteProduct = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error deleting product",
      });
    }

    res.json({
      success: true,
      message: "Product Deleted Successfully",
    });
  });
};

// ======================
// EXPORTS
// ======================
module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
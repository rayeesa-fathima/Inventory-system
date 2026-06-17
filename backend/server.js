// ADD these imports at the top
require('dotenv').config();
const orderRoutes = require('./routes/orderRoutes');
const auditRoutes = require('./routes/auditRoutes');
const stockRoutes = require('./routes/stockRoutes');


console.log("SERVER FILE LOADED");

const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ADD these after your existing app.use('/api/products', ...) line
app.use('/api/orders', orderRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stock', stockRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

const PORT = 5000;
console.log("JWT_SECRET =", process.env.JWT_SECRET);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("DATABASE CONNECTED SUCCESSFULLY");
  } catch (err) {
    console.error("DATABASE CONNECTION FAILED:", err);
  }
})();
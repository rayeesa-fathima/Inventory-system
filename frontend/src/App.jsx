import Orders from "./orders/orders";
import "./App.css";
import { useEffect, useState } from "react";
const API_URL = "https://inventory-system-qs4j.onrender.com";


const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "inventory", label: "Inventory" },
  { key: "add", label: "Add Item" },
  { key: "orders", label: "Orders" },
  { key: "lowstock", label: "Low Stock" },
  { key: "categories", label: "Categories" },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

/* ─── LOGIN SCREEN ───────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, { 
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials.");
      } else {
        localStorage.setItem("ims_token", data.token);
        localStorage.setItem("ims_user",  JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">IMS</div>
          <h2>Inventory Management</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@inventory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
function App() {
  /* ── Auth state ── */
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("ims_user");
    return saved ? JSON.parse(saved) : null;
  });

  /* ── App state ── */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products,    setProducts]    = useState([]);
  const [activeNav,   setActiveNav]   = useState("dashboard");

  const [name,     setName]     = useState("");
  const [sku,      setSku]      = useState("");
  const [category, setCategory] = useState("");
  const [price,    setPrice]    = useState("");
  const [stock,    setStock]    = useState("");
  const [editId,   setEditId]   = useState(null);
  const [search,   setSearch]   = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [currentUser]);

  /* ── Auth handlers ── */
  const handleLogin = (user) => setCurrentUser(user);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("ims_token");
    localStorage.removeItem("ims_user");
    setCurrentUser(null);
    setActiveNav("dashboard");
  };

  /* ── API helper (attaches JWT) ── */
  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem("ims_token");
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  /* ── Products ── */
  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (e) { console.log(e); }
  };

  const clearForm = () => {
    setEditId(null); setName(""); setSku("");
    setCategory(""); setPrice(""); setStock("");
  };

  const addProduct = async () => {
    if (!name || !sku || !price) { alert("Name, SKU and Price are required."); return; }
    try {
      const res = await authFetch(`${API_URL}/api/products`, {
        method: "POST",
        body: JSON.stringify({ name, sku, category, price, stock, low_stock_limit: 5, status: "active" }),
      });
      const data = await res.json();
      alert(data.message);
      fetchProducts(); clearForm();
    } catch (e) { console.log(e); }
  };

  const updateProduct = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/products/${editId}`, {
        method: "PUT",
        body: JSON.stringify({ name, sku, category, price, stock, low_stock_limit: 5, status: "active" }),
      });
      const data = await res.json();
      alert(data.message);
      fetchProducts(); clearForm(); setActiveNav("inventory");
    } catch (e) { console.log(e); }
  };

  const deleteProduct = async (id) => {
    if (currentUser?.role !== "admin") {
      alert("Only admins can delete products."); return;
    }
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/products/${id}`,  { method: "DELETE" });
      const data = await res.json();
      alert(data.message);
      fetchProducts();
    } catch (e) { console.log(e); }
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.low_stock_limit);
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginated  = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage, currentPage * rowsPerPage
  );

  const handleNavClick = (key) => {
    setActiveNav(key);
    if (key === "add") clearForm();
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const getPageTitle = () => {
    const map = {
      dashboard:  "Inventory Dashboard",
      inventory:  "Inventory Management",
      add:        editId ? "Update Product" : "Add Product",
      lowstock:   "Low Stock Alerts",
      reports:    "Sales Report",
      categories: "Product Categories",
      orders: "Order Management",
    };
    return map[activeNav] || "";
  };

  /* ── Show Login if not logged in ── */
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  /* ── Main Dashboard ── */
  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-brand">
          {sidebarOpen ? <span className="brand-text">IMS</span> : <span className="brand-mini">IMS</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              {sidebarOpen
                ? <span className="nav-label">{item.label}</span>
                : <span className="nav-mini">{item.label.charAt(0)}</span>
              }
            </div>
          ))}
        </nav>

        {/* User info + Logout at bottom of sidebar */}
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-text">
                <div className="sidebar-user-name">{currentUser.name}</div>
                <div className="sidebar-user-role">{currentUser.role}</div>
              </div>
            </div>
          )}
          <div className="nav-item logout" onClick={handleLogout} title="Logout">
            {sidebarOpen
              ? <span className="nav-label">Logout</span>
              : <span className="nav-mini">L</span>
            }
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={`main-content ${sidebarOpen ? "shifted" : ""}`}>

        {/* Topbar */}
        <div className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen((p) => !p)} aria-label="Toggle sidebar">
            <span className="hline"></span>
            <span className="hline"></span>
            <span className="hline"></span>
          </button>

          <h1 className="page-title">{getPageTitle()}</h1>

          <div className="topbar-right">
            <span className="topbar-date">{today}</span>
            {/* Real user name + role badge */}
            <div className="user-badge">
              <span className="user-badge-avatar">{currentUser.name?.charAt(0).toUpperCase()}</span>
              <span className="user-badge-name">{currentUser.name}</span>
              <span className="user-badge-role">{currentUser.role}</span>
            </div>
            <button className="logout-topbar-btn" onClick={handleLogout} title="Logout">
              Logout
            </button>
          </div>
        </div>

        {/* ── Dashboard Cards ── */}
        {(activeNav === "dashboard" || activeNav === "inventory") && (
          <div className="dashboard">
            <div className="card card--blue">
              <div className="card-body">
                <div className="card-label">TOTAL ITEMS</div>
                <div className="card-value">{products.length}</div>
              </div>
            </div>
            <div className="card card--green">
              <div className="card-body">
                <div className="card-label">ACTIVE PRODUCTS</div>
                <div className="card-value">{products.filter((p) => p.status === "active").length}</div>
              </div>
            </div>
            <div className="card card--teal">
              <div className="card-body">
                <div className="card-label">CATEGORIES</div>
                <div className="card-value">{new Set(products.map((p) => p.category)).size}</div>
              </div>
            </div>
            <div className="card card--red">
              <div className="card-body">
                <div className="card-label">LOW STOCK</div>
                <div className="card-value">{products.filter((p) => p.stock <= p.low_stock_limit).length}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Low Stock ── */}
        {activeNav === "lowstock" && (
          <div className="section-card">
            <h2 className="section-title">Low Stock Alerts</h2>
            {lowStockProducts.length === 0 ? (
              <p className="empty-state">All products are sufficiently stocked.</p>
            ) : (
              <div className="table-wrap" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>SKU</th><th>Category</th><th>Stock</th><th>Limit</th></tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td className="product-name">{p.name}</td>
                        <td><code className="sku-code">{p.sku}</code></td>
                        <td>{p.category}</td>
                        <td><span className="badge low-stock">{p.stock}</span></td>
                        <td>{p.low_stock_limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Add / Edit Form ── */}
        {(activeNav === "add" || (activeNav === "inventory" && editId)) && (
          <div className="section-card form-section">
            <h2 className="section-title">{editId ? "Update Item" : "Add New Item"}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" placeholder="e.g. Wireless Mouse"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input type="text" placeholder="e.g. WM-001"
                  value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" placeholder="e.g. Electronics"
                  value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Price (Rs.)</label>
                <input type="number" placeholder="0.00"
                  value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" placeholder="0"
                  value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div className="form-group form-actions">
                <label>&nbsp;</label>
                <div className="btn-row">
                  <button className="btn btn--primary" onClick={editId ? updateProduct : addProduct}>
                    {editId ? "Update Item" : "Add Item"}
                  </button>
                  {editId && (
                    <button className="btn btn--ghost" onClick={() => { clearForm(); setActiveNav("inventory"); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Inventory Table ── */}
        {(activeNav === "dashboard" || activeNav === "inventory") && (
          <>
            <div className="table-toolbar">
              <h2 className="section-title">Inventory List</h2>
              <div className="table-controls">
                <div className="show-entries">
                  <label htmlFor="rowsSelect">Show</label>
                  <select id="rowsSelect" value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <label htmlFor="rowsSelect">entries</label>
                </div>
                <div className="search-wrapper">
                  <input className="search-input" type="text"
                    placeholder="Search by name, SKU, category..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>SKU</th><th>Category</th>
                    <th>Status</th><th>Price</th><th>Stock</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="empty-state">No products found.</td></tr>
                  ) : (
                    paginated.map((product, idx) => (
                      <tr key={product.id}>
                        <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                        <td className="product-name">{product.name}</td>
                        <td><code className="sku-code">{product.sku}</code></td>
                        <td>{product.category}</td>
                        <td>
                          {product.stock === 0
                            ? <span className="badge out-stock">Out of Stock</span>
                            : product.stock <= product.low_stock_limit
                              ? <span className="badge low-stock">Low Stock</span>
                              : <span className="badge in-stock">In Stock</span>
                          }
                        </td>
                        <td className="price-cell">Rs.{product.price}</td>
                        <td className="stock-cell">{product.stock}</td>
                        <td className="action-cell">
                          <button className="btn btn--stock"
                            onClick={() => alert(`Stock entry for ${product.name}`)}>
                            Stock
                          </button>
                          <button className="btn btn--edit" onClick={() => {
                            setEditId(product.id);
                            setName(product.name); setSku(product.sku);
                            setCategory(product.category); setPrice(product.price);
                            setStock(product.stock);
                            setActiveNav("add");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}>Edit</button>
                          {/* Delete only visible to admin */}
                          {currentUser?.role === "admin" && (
                            <button className="btn btn--delete"
                              onClick={() => deleteProduct(product.id)}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pagination-info">
                Showing{" "}
                {filteredProducts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}{" "}
                to {Math.min(currentPage * rowsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} entries
              </span>
              <div className="pagination-btns">
                <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}>Next</button>
              </div>
            </div>
          </>
        )}

        {activeNav === "reports" && (
          <div className="section-card">
            <h2 className="section-title">Sales Report</h2>
            <p className="empty-state">Reports coming soon.</p>
          </div>
        )}

        {activeNav === "categories" && (
          <div className="section-card">
            <h2 className="section-title">Product Categories</h2>
            {[...new Set(products.map((p) => p.category))].length === 0 ? (
              <p className="empty-state">No categories yet.</p>
            ) : (
              <div className="category-grid">
                {[...new Set(products.map((p) => p.category))].map((cat) => (
                  <div key={cat} className="category-chip">
                    {cat}
                    <span className="cat-count">{products.filter((p) => p.category === cat).length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeNav === "orders" && (
  <Orders />
)}

        <footer className="footer">Developed by AURO</footer>
      </div>
    </div>
  );
}

export default App;
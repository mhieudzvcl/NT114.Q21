import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const PRODUCTS = [
  { id: 1, name: "Áo Thun Basic", price: 120, category: "Áo thun", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { id: 2, name: "Áo Thun Oversize", price: 150, category: "Áo thun", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80" },
  { id: 3, name: "Sơ Mi Trắng Slimfit", price: 220, category: "Sơ mi", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80" },
  { id: 4, name: "Sơ Mi Kẻ Caro", price: 195, category: "Sơ mi", image: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&q=80" },
  { id: 5, name: "Quần Jean Straight", price: 280, category: "Quần jean", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
  { id: 6, name: "Quần Jean Skinny", price: 260, category: "Quần jean", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80" },
  { id: 7, name: "Giày Sneaker Trắng", price: 520, category: "Giày dép", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: 8, name: "Giày Thể Thao", price: 480, category: "Giày dép", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80" },
  { id: 9, name: "Áo Khoác Denim", price: 390, category: "Áo khoác", image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&q=80" },
  { id: 10, name: "Áo Khoác Hoodie", price: 350, category: "Áo khoác", image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80" },
  { id: 11, name: "Mũ Snapback", price: 95, category: "Phụ kiện", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80" },
  { id: 12, name: "Túi Tote Canvas", price: 130, category: "Phụ kiện", image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80" },
];

const CATEGORIES = ["Tất cả", ...new Set(PRODUCTS.map(p => p.category))];

function Navbar({ cartCount, darkMode, toggleDark, onCartClick }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">🛍</span>
        <span className="brand-name">Cartify</span>
      </div>
      <div className="nav-actions">
        <button className="icon-btn theme-btn" onClick={toggleDark} title="Toggle theme">
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button className="icon-btn cart-btn" onClick={onCartClick}>
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </nav>
  );
}

function CartDrawer({ cart, onClose, onRemove, onClear }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Giỏ hàng</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <div className="drawer-empty">
            <span>🛒</span>
            <p>Giỏ hàng trống</p>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {cart.map(item => (
                <div className="drawer-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">{item.price}k × {item.qty}</p>
                  </div>
                  <button className="remove-btn" onClick={() => onRemove(item.id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="drawer-footer">
              <div className="total-row">
                <span>Tổng cộng</span>
                <strong>{total}k</strong>
              </div>
              <button className="checkout-btn">Thanh toán</button>
              <button className="clear-btn" onClick={onClear}>Xóa tất cả</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [cartOpen, setCartOpen] = useState(false);
  const [added, setAdded] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchCat = category === "Tất cả" || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1200);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="app">
      <Navbar
        cartCount={cartCount}
        darkMode={darkMode}
        toggleDark={() => setDarkMode(d => !d)}
        onCartClick={() => setCartOpen(true)}
      />

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      )}

      <div className="hero">
        <p className="hero-sub">Thời trang đơn giản — phong cách mỗi ngày</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm sản phẩm, danh mục..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="clear-search" onClick={() => setSearch("")}>✕</button>}
        </div>
      </div>

      <div className="categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="container">
        {filtered.length === 0 ? (
          <div className="no-result">
            <span>😕</span>
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map(p => (
              <div className="card" key={p.id}>
                <div className="card-img-wrap">
                  <img src={p.image} alt={p.name} className="card-img" loading="lazy" />
                  <span className="cat-tag">{p.category}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{p.name}</h3>
                  <div className="card-footer">
                    <span className="card-price">{p.price}k</span>
                    <button
                      className={`add-btn ${added === p.id ? "added" : ""}`}
                      onClick={() => addToCart(p)}
                    >
                      {added === p.id ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 Cartify — NT114.Q21 · Đồ án chuyên ngành</p>
      </footer>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);

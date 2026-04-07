import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

/* ================================================================
   API LAYER
   ================================================================ */
const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function authHeaders() {
  const t = localStorage.getItem("accessToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function api(path, opts = {}) {
  const { method = "GET", body, auth = false } = opts;
  const headers = { "Content-Type": "application/json", ...(auth ? authHeaders() : {}) };
  const res = await fetch(`${API}/api/v1${path}`, {
    method, headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) {
    const errMsg = json?.error?.message || json?.message || "Request failed";
    throw { status: res.status, message: errMsg, ...json };
  }
  let result = json?.data !== undefined ? json.data : json;
  if (result && typeof result === "object" && result.success !== undefined && result.data !== undefined) {
    result = result.data;
  }
  return result;
}

/* ================================================================
   AUTH CONTEXT
   ================================================================ */
const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const profile = await api("/users/me", { auth: true });
      setUser(profile);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { hydrateUser(); }, [hydrateUser]);

  const login = async (email, password) => {
    const res = await api("/auth/login", { method: "POST", body: { email, password } });
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    await hydrateUser();
    return res;
  };

  const register = async (email, password) => {
    return api("/auth/register", { method: "POST", body: { email, password } });
  };

  const logout = async () => {
    const rt = localStorage.getItem("refreshToken");
    try { if (rt) await api("/auth/logout", { method: "POST", body: { refreshToken: rt } }); } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, hydrateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

function useAuth() { return useContext(AuthCtx); }

/* ================================================================
   TOAST
   ================================================================ */
let _toastId = 0;
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <span className="toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   SVG ICONS
   ================================================================ */
const Icons = {
  store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
};

function Icon({ name, size = 18 }) {
  return <span className="icon" style={{ width: size, height: size }}>{Icons[name] || Icons.box}</span>;
}

/* ================================================================
   PAGE: Auth
   ================================================================ */
function AuthPage({ onNavigate, addToast }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
        addToast("Đăng nhập thành công!", "success");
        onNavigate("shop");
      } else {
        await register(email, password);
        addToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        setIsLogin(true);
      }
    } catch (err) {
      addToast(err?.message || "Thao tác thất bại", "error");
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
        <p className="auth-subtitle">
          {isLogin ? "Chào mừng bạn trở lại Cartify" : "Tạo tài khoản Cartify mới"}
        </p>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự" required minLength={8} autoComplete="current-password" />
          </div>
          <button className="btn-primary btn-full" disabled={busy}>
            {busy ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button className="link-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   PAGE: Shop
   ================================================================ */
function ShopPage({ addToast }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [added, setAdded] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await api(`/products?search=${search}`);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
    setLoadingProducts(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const activeProducts = useMemo(() => {
    let list = products.filter(p => p.status === "ACTIVE");
    if (category !== "all") {
      list = list.filter(p => p.category === category);
    }
    return list;
  }, [products, category]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAdded(product._id);
    setTimeout(() => setAdded(null), 1200);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const checkout = async () => {
    if (!user) { addToast("Vui lòng đăng nhập để đặt hàng", "error"); return; }
    if (cart.length === 0) return;
    try {
      const items = cart.map(i => ({ productId: i.sku, qty: i.qty }));
      await api("/orders", { method: "POST", body: { items }, auth: true });
      addToast("Đặt hàng thành công!", "success");
      clearCart();
      setCartOpen(false);
    } catch (err) {
      addToast(err?.message || "Đặt hàng thất bại", "error");
    }
  };

  const fmtPrice = (p) => typeof p === "number" ? p.toLocaleString("vi-VN") + "₫" : "0₫";

  const categories = [
    { id: "all", name: "Tất cả" },
    { id: "Áo", name: "Áo" },
    { id: "Quần", name: "Quần" },
    { id: "Phụ kiện", name: "Phụ kiện" },
    { id: "Giày", name: "Giày" },
  ];

  return (
    <>
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{selectedProduct.name}</h3>
              <button className="icon-btn" onClick={() => setSelectedProduct(null)}><Icon name="x" /></button>
            </div>
            {selectedProduct.imageUrl ? (
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name}
                style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
            ) : (
              <div style={{ width: '100%', height: 180, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name="box" size={56} />
              </div>
            )}
            <div className="detail-grid" style={{ marginBottom: 12 }}>
              <div className="detail-item"><span className="detail-label">SKU</span><code>{selectedProduct.sku}</code></div>
              <div className="detail-item"><span className="detail-label">Danh mục</span><span>{selectedProduct.category || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">Tồn kho</span><span>{selectedProduct.stock} sản phẩm</span></div>
              <div className="detail-item"><span className="detail-label">Trạng thái</span>
                <span className={`status-badge status-${selectedProduct.status?.toLowerCase()}`}>{selectedProduct.status}</span>
              </div>
            </div>
            {selectedProduct.description && (
              <p style={{ color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>{selectedProduct.description}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{fmtPrice(selectedProduct.price)}</span>
              <button className="btn-primary" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                <Icon name="cart" size={16} /> Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-overlay" onClick={() => setCartOpen(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Giỏ hàng</h2>
              <button className="icon-btn" onClick={() => setCartOpen(false)}><Icon name="x" /></button>
            </div>
            {cart.length === 0 ? (
              <div className="drawer-empty">
                <Icon name="cart" size={48} />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <>
                <div className="drawer-items">
                  {cart.map(item => (
                    <div className="drawer-item" key={item._id}>
                      <div className="drawer-item-icon">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <Icon name="box" size={28} />
                        )}
                      </div>
                      <div className="item-info">
                        <p className="item-name">{item.name}</p>
                        <p className="item-price">{fmtPrice(item.price)} × {item.qty}</p>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item._id)}><Icon name="x" size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="drawer-footer">
                  <div className="total-row">
                    <span>Tổng cộng</span>
                    <strong>{fmtPrice(cart.reduce((s, i) => s + i.price * i.qty, 0))}</strong>
                  </div>
                  <button className="checkout-btn" onClick={checkout}>Đặt hàng</button>
                  <button className="clear-btn" onClick={clearCart}>Xóa tất cả</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="hero">
        <p className="hero-sub">Thời trang đơn giản — phong cách mỗi ngày</p>
        <div className="search-bar">
          <span className="search-icon"><Icon name="search" size={16} /></span>
          <input type="text" placeholder="Tìm kiếm sản phẩm..." value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => setSearch("")}><Icon name="x" size={14} /></button>}
        </div>
        <div className="category-filters" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c.id} 
              className={`btn-sm ${category === c.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <button className="cart-fab" onClick={() => setCartOpen(true)}>
        <Icon name="cart" size={22} />
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>

      <main className="container">
        {loadingProducts ? (
          <div className="loading-state"><div className="spinner" /><p>Đang tải sản phẩm...</p></div>
        ) : activeProducts.length === 0 ? (
          <div className="no-result"><Icon name="search" size={48} /><p>Không tìm thấy sản phẩm nào</p></div>
        ) : (
          <div className="grid">
            {activeProducts.map(p => (
              <div className="card" key={p._id} onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
                <div className="card-img-wrap">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                  ) : (
                    <div className="card-img-placeholder"><Icon name="box" size={48} /></div>
                  )}
                  <span className="cat-tag">{p.category || p.sku}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{p.name}</h3>
                  {p.description && <p className="card-desc">{p.description}</p>}
                  <div className="card-meta">
                    <span className="stock-badge">Kho: {p.stock}</span>
                  </div>
                  <div className="card-footer">
                    <span className="card-price">{fmtPrice(p.price)}</span>
                    <button className={`add-btn ${added === p._id ? "added" : ""}`}
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                      {added === p._id ? <Icon name="check" size={16} /> : <Icon name="plus" size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

/* ================================================================
   PAGE: Profile
   ================================================================ */
function ProfilePage({ addToast }) {
  const { hydrateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", avatarUrl: "" });
  const fileInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api("/users/me", { auth: true });
      setProfile(data);
      setForm({ fullName: data?.fullName || "", phone: data?.phone || "", avatarUrl: data?.avatarUrl || "" });
    } catch {
      addToast("Không thể tải hồ sơ", "error");
    }
  }, [addToast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile?._id) return;
    try {
      await api(`/users/${profile._id}`, { method: "PATCH", body: form, auth: true });
      addToast("Cập nhật hồ sơ thành công!", "success");
      setEditing(false);
      fetchProfile();
      hydrateUser();
    } catch (err) {
      addToast(err?.message || "Cập nhật thất bại", "error");
    }
  };

  if (!profile) return <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Hồ sơ người dùng</h1>
        <p className="page-desc">Quản lý thông tin cá nhân của bạn</p>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <div className="avatar-wrap">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-circle">{(profile.fullName || profile.userId || "U")[0].toUpperCase()}</div>
            )}
          </div>
          <div>
            <h3>{profile.fullName || "Chưa đặt tên"}</h3>
            <p className="text-muted">{profile.userId}</p>
          </div>
          {!editing && (
            <button className="btn-outline" style={{ marginLeft: "auto" }} onClick={() => setEditing(true)}>
              <Icon name="edit" size={14} /> Chỉnh sửa
            </button>
          )}
        </div>

        {editing ? (
          <form className="edit-form" onSubmit={saveProfile}>
             <div className="form-group">
              <label>Ảnh đại diện</label>
              <div className="avatar-upload-area">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Preview" className="avatar-preview" />
                ) : (
                  <div className="avatar-placeholder"><Icon name="user" size={32} /></div>
                )}
                <div className="avatar-upload-actions">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange}
                    style={{ display: "none" }} />
                  <button type="button" className="btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <Icon name="upload" size={14} /> Chọn ảnh mới
                  </button>
                  {form.avatarUrl && (
                    <button type="button" className="btn-outline btn-sm" onClick={() => setForm({ ...form, avatarUrl: "" })}>
                      <Icon name="x" size={14} /> Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Họ tên</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nhập họ tên" required />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Nhập số điện thoại" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Lưu thay đổi</button>
              <button type="button" className="btn-outline" onClick={() => { setEditing(false); fetchProfile(); }}>Hủy</button>
            </div>
          </form>
        ) : (
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-label">User ID</span><span>{profile.userId}</span></div>
            <div className="detail-item"><span className="detail-label">Họ tên</span><span>{profile.fullName || "—"}</span></div>
            <div className="detail-item"><span className="detail-label">Điện thoại</span><span>{profile.phone || "—"}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   PAGE: Admin Products
   ================================================================ */
function AdminProductsPage({ addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ sku: "", name: "", description: "", price: 0, stock: 0, status: "ACTIVE", category: "Áo", imageUrl: "" });
  const fileInputRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const resetForm = () => {
    setForm({ sku: "", name: "", description: "", price: 0, stock: 0, status: "ACTIVE", category: "Áo", imageUrl: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (p) => {
    setForm({ sku: p.sku, name: p.name, description: p.description || "", price: p.price, stock: p.stock, status: p.status, category: p.category || "Áo", imageUrl: p.imageUrl || "" });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: "PATCH", body: { name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock), status: form.status, category: form.category, imageUrl: form.imageUrl }, auth: true });
        addToast("Cập nhật sản phẩm thành công!", "success");
      } else {
        await api("/products", { method: "POST", body: { ...form, price: Number(form.price), stock: Number(form.stock) }, auth: true });
        addToast("Thêm sản phẩm thành công!", "success");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      addToast(err?.message || "Thao tác thất bại", "error");
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api(`/products/${id}`, { method: "DELETE", auth: true });
      addToast("Đã xóa sản phẩm (INACTIVE)", "success");
      fetchProducts();
    } catch (err) {
      addToast(err?.message || "Xóa thất bại", "error");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p className="page-desc">Thêm, sửa, xoá sản phẩm trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Thêm sản phẩm</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
            <form className="edit-form" onSubmit={submit}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label>Ảnh minh họa</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="upload" size={20} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    <button type="button" className="btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                      <Icon name="upload" size={14} /> Chọn ảnh
                    </button>
                    {form.imageUrl && (
                      <button type="button" className="btn-outline btn-sm" onClick={() => setForm({ ...form, imageUrl: "" })}>
                        <Icon name="x" size={14} /> Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>SKU</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                    required disabled={!!editingId} placeholder="VD: SKU-001" /></div>
                <div className="form-group"><label>Tên sản phẩm</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    required placeholder="Nhập tên sản phẩm" /></div>
              </div>
              <div className="form-group"><label>Mô tả</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn (tuỳ chọn)" /></div>
              <div className="form-row">
                <div className="form-group"><label>Giá (VNĐ)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    min="0" required /></div>
                <div className="form-group"><label>Tồn kho</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    min="0" required /></div>
              </div>
              <div className="form-row">
                 <div className="form-group"><label>Danh mục</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="Áo">Áo</option>
                    <option value="Quần">Quần</option>
                    <option value="Phụ kiện">Phụ kiện</option>
                    <option value="Giày">Giày</option>
                  </select></div>
                <div className="form-group"><label>Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingId ? "Cập nhật" : "Tạo mới"}</button>
                <button type="button" className="btn-outline" onClick={resetForm}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Ảnh</th><th>SKU</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className={p.status === "INACTIVE" ? "row-inactive" : ""}>
                  <td>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 40, height: 40, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}><Icon name="box" size={16} /></div>}
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.name}</td>
                  <td>{p.category || "—"}</td>
                  <td>{p.price?.toLocaleString("vi-VN")}₫</td>
                  <td>{p.stock}</td>
                  <td><span className={`status-badge status-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td className="action-cell">
                    <button className="btn-sm btn-outline" onClick={() => openEdit(p)}><Icon name="edit" size={14} /></button>
                    {p.status === "ACTIVE" && (
                      <button className="btn-sm btn-danger" onClick={() => deleteProduct(p._id)}><Icon name="trash" size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PAGE: Orders
   ================================================================ */
function OrdersPage({ addToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/orders", { auth: true });
      setOrders(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api(`/orders/${id}/status`, { method: "PATCH", body: { status: newStatus }, auth: true });
      addToast(`Cập nhật trạng thái → ${newStatus}`, "success");
      fetchOrders();
    } catch (err) {
      addToast(err?.message || "Cập nhật thất bại", "error");
    }
  };

  const viewDetail = async (id) => {
    try {
      const data = await api(`/orders/${id}`, { auth: true });
      setSelectedOrder(data);
    } catch {
      addToast("Không thể tải chi tiết đơn hàng", "error");
    }
  };

  const statusColors = { PENDING: "pending", PAID: "paid", SHIPPED: "shipped", CANCELLED: "cancelled" };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Đơn hàng</h1>
          <p className="page-desc">Quản lý và theo dõi tất cả đơn hàng</p>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Chi tiết đơn hàng</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">ID</span><span><code>{selectedOrder._id}</code></span></div>
              <div className="detail-item"><span className="detail-label">User ID</span><span>{selectedOrder.userId}</span></div>
              <div className="detail-item"><span className="detail-label">Trạng thái</span>
                <span className={`status-badge status-${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
              <div className="detail-item"><span className="detail-label">Tổng tiền</span><span>{selectedOrder.totalAmount?.toLocaleString("vi-VN")}₫</span></div>
            </div>
            <h4 style={{ marginTop: 16 }}>Sản phẩm trong đơn:</h4>
            <div className="order-items-list">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <span>Mã SP: <code>{item.productId}</code></span>
                  <span>SL: {item.qty}</span>
                  <span>Đơn giá: {item.unitPrice?.toLocaleString("vi-VN")}₫</span>
                </div>
              ))}
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn-outline" onClick={() => setSelectedOrder(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : orders.length === 0 ? (
        <div className="no-result"><Icon name="list" size={48} /><p>Chưa có đơn hàng nào</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>User</th><th>Số SP</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td><code className="id-code">{o._id?.slice(-8)}</code></td>
                  <td>{o.userId}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>{o.totalAmount?.toLocaleString("vi-VN")}₫</td>
                  <td><span className={`status-badge status-${statusColors[o.status]}`}>{o.status}</span></td>
                  <td className="action-cell">
                    <button className="btn-sm btn-outline" onClick={() => viewDetail(o._id)}><Icon name="eye" size={14} /></button>
                    {o.status === "PENDING" && <>
                      <button className="btn-sm btn-success" onClick={() => updateStatus(o._id, "PAID")}><Icon name="dollar" size={14} /></button>
                      <button className="btn-sm btn-danger" onClick={() => updateStatus(o._id, "CANCELLED")}><Icon name="x" size={14} /></button>
                    </>}
                    {o.status === "PAID" && (
                      <button className="btn-sm btn-primary-sm" onClick={() => updateStatus(o._id, "SHIPPED")}><Icon name="truck" size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PAGE: Notifications
   ================================================================ */
function NotificationsPage({ addToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: "", channel: "EMAIL", title: "", content: "" });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/notifications", { auth: true });
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      await api("/notifications", { method: "POST", body: form, auth: true });
      addToast("Gửi thông báo thành công!", "success");
      setShowForm(false);
      setForm({ userId: "", channel: "EMAIL", title: "", content: "" });
      fetchNotifications();
    } catch (err) {
      addToast(err?.message || "Gửi thất bại", "error");
    }
  };

  const retryNotification = async (id) => {
    try {
      await api(`/notifications/retry/${id}`, { method: "POST", auth: true });
      addToast("Đã gửi lại thông báo", "success");
      fetchNotifications();
    } catch (err) {
      addToast(err?.message || "Gửi lại thất bại", "error");
    }
  };

  const channelIcons = { EMAIL: "mail", WEBHOOK: "link", INAPP: "bell" };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Thông báo</h1>
          <p className="page-desc">Gửi và quản lý thông báo hệ thống</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Icon name="send" size={16} /> Gửi thông báo</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Gửi thông báo mới</h3>
            <form className="edit-form" onSubmit={sendNotification}>
              <div className="form-row">
                <div className="form-group"><label>User ID</label>
                  <input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                    required placeholder="ID người nhận" /></div>
                <div className="form-group"><label>Kênh gửi</label>
                  <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                    <option value="EMAIL">EMAIL</option>
                    <option value="WEBHOOK">WEBHOOK</option>
                    <option value="INAPP">INAPP</option>
                  </select></div>
              </div>
              <div className="form-group"><label>Tiêu đề</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required placeholder="Tiêu đề thông báo" /></div>
              <div className="form-group"><label>Nội dung</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  required placeholder="Nội dung chi tiết..." rows={3} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Gửi</button>
                <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : notifications.length === 0 ? (
        <div className="no-result"><Icon name="bell" size={48} /><p>Chưa có thông báo nào</p></div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div className="notification-card" key={n._id}>
              <div className="notif-icon"><Icon name={channelIcons[n.channel] || "bell"} size={24} /></div>
              <div className="notif-body">
                <div className="notif-top">
                  <strong>{n.title}</strong>
                  <span className={`status-badge status-${n.status?.toLowerCase()}`}>{n.status}</span>
                </div>
                <p className="notif-content">{n.content}</p>
                <div className="notif-meta">
                  <span>User: {n.userId}</span>
                  <span>Kênh: {n.channel}</span>
                  {n.createdAt && <span>{new Date(n.createdAt).toLocaleString("vi-VN")}</span>}
                </div>
              </div>
              <button className="btn-sm btn-outline" onClick={() => retryNotification(n._id)} title="Gửi lại"><Icon name="refresh" size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MAIN APP
   ================================================================ */
function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [page, setPage] = useState("shop");
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <AuthProvider>
      <div className="app">
        <AppNavbar page={page} setPage={(p) => { setPage(p); setMobileMenuOpen(false); }}
          darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)}
          mobileMenuOpen={mobileMenuOpen} toggleMobile={() => setMobileMenuOpen(m => !m)}
          addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <PageRouter page={page} setPage={setPage} addToast={addToast} />
        <footer className="footer">
          <p>© 2026 Cartify — NT114.Q21 · Đồ án chuyên ngành · DevSecOps Microservices</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

function AppNavbar({ page, setPage, darkMode, toggleDark, mobileMenuOpen, toggleMobile, addToast }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    addToast("Đã đăng xuất", "info");
    setPage("shop");
  };

  const navItems = [
    { key: "shop", label: "Cửa hàng", icon: "store" },
    ...(user ? [
      { key: "orders", label: "Đơn hàng", icon: "box" },
      { key: "products-admin", label: "Sản phẩm", icon: "list" },
      { key: "notifications", label: "Thông báo", icon: "bell" },
      { key: "profile", label: "Hồ sơ", icon: "user" },
    ] : []),
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setPage("shop")} style={{ cursor: "pointer" }}>
        <span className="brand-icon"><Icon name="store" size={22} /></span>
        <span className="brand-name">Cartify</span>
      </div>

      <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
        {navItems.map(n => (
          <button key={n.key} className={`nav-link ${page === n.key ? "active" : ""}`}
            onClick={() => setPage(n.key)}>
            <span className="nav-link-icon"><Icon name={n.icon} size={16} /></span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-actions">
        <button className="icon-btn theme-btn" onClick={toggleDark} title="Toggle theme">
          {darkMode ? <Icon name="sun" size={16} /> : <Icon name="moon" size={16} />}
        </button>
        {user ? (
          <button className="btn-outline btn-sm" onClick={handleLogout}><Icon name="logout" size={14} /> Đăng xuất</button>
        ) : (
          <button className="btn-primary btn-sm" onClick={() => setPage("auth")}>Đăng nhập</button>
        )}
        <button className="icon-btn mobile-menu-btn" onClick={toggleMobile}><Icon name="menu" size={18} /></button>
      </div>
    </nav>
  );
}

function PageRouter({ page, setPage, addToast }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-state" style={{ marginTop: 80 }}><div className="spinner" /><p>Đang tải...</p></div>;

  switch (page) {
    case "auth":
      return user ? (setPage("shop"), null) : <AuthPage onNavigate={setPage} addToast={addToast} />;
    case "shop":
      return <ShopPage addToast={addToast} />;
    case "profile":
      return user ? <ProfilePage addToast={addToast} /> : (setPage("auth"), null);
    case "products-admin":
      return user ? <AdminProductsPage addToast={addToast} /> : (setPage("auth"), null);
    case "orders":
      return user ? <OrdersPage addToast={addToast} /> : (setPage("auth"), null);
    case "notifications":
      return user ? <NotificationsPage addToast={addToast} /> : (setPage("auth"), null);
    default:
      return <ShopPage addToast={addToast} />;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);

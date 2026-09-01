// ---------- small helpers ----------

function toast(message, variant = 'primary') {
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${variant} border-0`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  host.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function money(n) {
  return '₹' + Number(n || 0).toFixed(2);
}

function closeAllModals() {
  document.querySelectorAll('.modal.show').forEach((m) => {
    bootstrap.Modal.getOrCreateInstance(m).hide();
  });
}

// ---------- view routing ----------

const VIEWS = ['catalog', 'product', 'login', 'register', 'cart', 'orders', 'seller', 'admin'];

function showView(name) {
  const user = getUser();
  if (['cart', 'orders'].includes(name) && !user) {
    toast('Please login first', 'warning');
    name = 'login';
  }
  if (name === 'seller' && user?.role !== 'seller') name = 'catalog';
  if (name === 'admin' && user?.role !== 'admin') name = 'catalog';

  VIEWS.forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle('d-none', v !== name);
  });

  if (name === 'catalog') loadCatalog();
  if (name === 'cart') loadCart();
  if (name === 'orders') loadOrders();
  if (name === 'seller') loadSellerDashboard();
  if (name === 'admin') loadAdminDashboard();
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-view]');
  if (link) {
    e.preventDefault();
    showView(link.dataset.view);
  }
});

// ---------- auth/nav state ----------

function refreshNav() {
  const user = getUser();
  document.querySelectorAll('.auth-only').forEach((el) => el.classList.toggle('d-none', !user));
  document.querySelectorAll('.guest-only').forEach((el) => el.classList.toggle('d-none', !!user));
  document.querySelectorAll('.role-seller').forEach((el) => el.classList.toggle('d-none', user?.role !== 'seller'));
  document.querySelectorAll('.role-admin').forEach((el) => el.classList.toggle('d-none', user?.role !== 'admin'));
  document.getElementById('whoami').textContent = user ? `${user.name} (${user.role})` : '';
  updateCartCount();
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  setToken(null);
  setUser(null);
  refreshNav();
  showView('catalog');
  toast('Logged out');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api.post('/auth/login', { email: fd.get('email'), password: fd.get('password') });
    setToken(data.token);
    setUser(data.user);
    refreshNav();
    toast(`Welcome back, ${data.user.name}!`, 'success');
    showView('catalog');
    e.target.reset();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api.post('/auth/register', {
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
      role: fd.get('role'),
    });
    setToken(data.token);
    setUser(data.user);
    refreshNav();
    toast(`Account created — welcome, ${data.user.name}!`, 'success');
    showView('catalog');
    e.target.reset();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// ---------- catalog ----------

let categoriesCache = [];

async function loadCategoriesInto(selectEl, { includeBlank = true, blankLabel = 'All categories' } = {}) {
  if (!categoriesCache.length) {
    const data = await api.get('/categories');
    categoriesCache = data.categories;
  }
  selectEl.innerHTML =
    (includeBlank ? `<option value="">${blankLabel}</option>` : '') +
    categoriesCache.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
}

let currentPage = 1;

async function loadCatalog(page = 1) {
  currentPage = page;
  const grid = document.getElementById('productGrid');
  grid.innerHTML = `<div class="col-12 text-center text-muted py-5">Loading...</div>`;

  try {
    await loadCategoriesInto(document.getElementById('filterCategory'));

    const keyword = document.getElementById('searchKeyword').value.trim();
    const categoryId = document.getElementById('filterCategory').value;
    const sort = document.getElementById('sortBy').value;

    const params = new URLSearchParams({ page, limit: 12 });
    if (keyword) params.set('keyword', keyword);
    if (categoryId) params.set('categoryId', categoryId);
    if (sort) params.set('sort', sort);

    const data = await api.get(`/products?${params.toString()}`);

    if (!data.products.length) {
      grid.innerHTML = `<div class="col-12 text-center text-muted py-5">No products found.</div>`;
    } else {
      grid.innerHTML = data.products.map(productCardHtml).join('');
    }
    renderPagination(data.pagination);
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-danger py-5">${escapeHtml(err.message)}</div>`;
  }
}

function productCardHtml(p) {
  return `
    <div class="col-sm-6 col-lg-3">
      <div class="card product-card shadow-sm">
        <div class="card-body">
          <h6 class="card-title">${escapeHtml(p.name)}</h6>
          <p class="card-text text-muted small flex-grow-1">${escapeHtml((p.description || '').slice(0, 80))}</p>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="price">${money(p.price)}</span>
            <span class="small text-muted">★ ${p.ratingAvg?.toFixed(1) ?? '0.0'} (${p.ratingCount || 0})</span>
          </div>
          <p class="small ${p.stock <= 5 ? 'low-stock' : 'text-muted'} mb-2">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
          <button class="btn btn-sm btn-outline-primary w-100" data-view-product="${p._id}">View</button>
        </div>
      </div>
    </div>`;
}

document.getElementById('productGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-view-product]');
  if (btn) openProduct(btn.dataset.viewProduct);
});

function renderPagination(pagination) {
  const el = document.getElementById('pagination');
  if (!pagination || pagination.totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<li class="page-item ${i === pagination.page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  el.innerHTML = html;
}

document.getElementById('pagination').addEventListener('click', (e) => {
  const link = e.target.closest('[data-page]');
  if (link) { e.preventDefault(); loadCatalog(Number(link.dataset.page)); }
});

document.getElementById('searchBtn').addEventListener('click', () => loadCatalog(1));

// ---------- product detail ----------

async function openProduct(id) {
  showView('product');
  const el = document.getElementById('productDetail');
  el.innerHTML = `<p class="text-muted">Loading...</p>`;

  try {
    const [{ product }, { reviews }] = await Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`),
    ]);

    const user = getUser();
    const isCustomer = user?.role === 'customer';

    el.innerHTML = `
      <a href="#" data-view="catalog" class="d-inline-block mb-3">&larr; Back to catalog</a>
      <div class="row">
        <div class="col-md-8">
          <h3>${escapeHtml(product.name)}</h3>
          <p class="text-muted">${escapeHtml(product.description)}</p>
          <p class="fs-4 fw-bold">${money(product.price)}</p>
          <p class="${product.stock <= 5 ? 'low-stock' : ''}">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          <p>★ ${product.ratingAvg?.toFixed(1) ?? '0.0'} average (${product.ratingCount || 0} review${product.ratingCount === 1 ? '' : 's'})</p>
          ${isCustomer ? `
            <div class="input-group" style="max-width:220px">
              <input type="number" min="1" value="1" class="form-control" id="addQty">
              <button class="btn btn-success" id="addToCartBtn" ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
            </div>` : ''}
        </div>
        <div class="col-md-4">
          <h5>Reviews</h5>
          <div id="reviewsList">
            ${reviews.length ? reviews.map((r) => `
              <div class="border-bottom pb-2 mb-2">
                <strong>${escapeHtml(r.userId?.name || 'Customer')}</strong> — ★ ${r.rating}
                <p class="small mb-0">${escapeHtml(r.comment || '')}</p>
              </div>`).join('') : '<p class="text-muted small">No reviews yet.</p>'}
          </div>
        </div>
      </div>`;

    document.getElementById('addToCartBtn')?.addEventListener('click', async () => {
      const qty = Number(document.getElementById('addQty').value) || 1;
      try {
        await api.post('/cart', { productId: id, quantity: qty });
        toast('Added to cart', 'success');
        updateCartCount();
      } catch (err) {
        toast(err.message, 'danger');
      }
    });
  } catch (err) {
    el.innerHTML = `<p class="text-danger">${escapeHtml(err.message)}</p>`;
  }
}

// ---------- cart ----------

async function updateCartCount() {
  const user = getUser();
  const badge = document.getElementById('cartCount');
  if (!user || user.role !== 'customer') { badge.textContent = ''; return; }
  try {
    const { cart } = await api.get('/cart');
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    badge.textContent = count || '';
  } catch {
    badge.textContent = '';
  }
}

async function loadCart() {
  const el = document.getElementById('cartItems');
  el.innerHTML = `<p class="text-muted">Loading...</p>`;
  try {
    const { cart } = await api.get('/cart');
    if (!cart.items.length) {
      el.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
      return;
    }
    let total = 0;
    el.innerHTML = `<div class="list-group">` + cart.items.map((item) => {
      const p = item.productId;
      const lineTotal = (p?.price || 0) * item.quantity;
      total += lineTotal;
      return `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${escapeHtml(p?.name || 'Product')}</strong><br>
            <span class="small text-muted">${money(p?.price)} x
              <input type="number" min="1" value="${item.quantity}" class="form-control form-control-sm d-inline-block" style="width:70px" data-qty="${p?._id}">
            </span>
          </div>
          <div class="text-end">
            <div>${money(lineTotal)}</div>
            <button class="btn btn-sm btn-outline-danger mt-1" data-remove="${p?._id}">Remove</button>
          </div>
        </div>`;
    }).join('') + `</div>
      <p class="text-end fs-5 fw-bold mt-3">Total: ${money(total)}</p>`;
  } catch (err) {
    el.innerHTML = `<p class="text-danger">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('cartItems').addEventListener('change', async (e) => {
  const input = e.target.closest('[data-qty]');
  if (!input) return;
  try {
    await api.put(`/cart/${input.dataset.qty}`, { quantity: Number(input.value) });
    loadCart();
    updateCartCount();
  } catch (err) {
    toast(err.message, 'danger');
    loadCart();
  }
});

document.getElementById('cartItems').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  try {
    await api.del(`/cart/${btn.dataset.remove}`);
    loadCart();
    updateCartCount();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('placeOrderBtn').addEventListener('click', async () => {
  const shippingAddress = {
    line1: document.getElementById('shipLine1').value,
    city: document.getElementById('shipCity').value,
    state: document.getElementById('shipState').value,
    postalCode: document.getElementById('shipZip').value,
    country: document.getElementById('shipCountry').value,
  };
  const couponCode = document.getElementById('couponCode').value.trim();

  if (Object.values(shippingAddress).some((v) => !v)) {
    toast('Please fill in the full shipping address', 'warning');
    return;
  }

  try {
    const body = { shippingAddress };
    if (couponCode) body.couponCode = couponCode;
    const { order } = await api.post('/orders', body);
    toast(`Order placed! Total ${money(order.totalAmount)}`, 'success');
    updateCartCount();
    showView('orders');
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// ---------- orders (customer) ----------

function statusBadge(status) {
  return `<span class="badge status-badge-${status}">${status}</span>`;
}

async function loadOrders() {
  const el = document.getElementById('ordersList');
  el.innerHTML = `<p class="text-muted">Loading...</p>`;
  try {
    const { orders } = await api.get('/orders');
    if (!orders.length) {
      el.innerHTML = `<p class="text-muted">You haven't placed any orders yet.</p>`;
      return;
    }
    el.innerHTML = orders.map((o) => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <strong>Order #${o._id.slice(-6)}</strong>
            ${statusBadge(o.status)}
          </div>
          <p class="small text-muted mb-1">${new Date(o.createdAt).toLocaleString()}</p>
          <ul class="small mb-2">
            ${o.items.map((i) => `<li>${escapeHtml(i.name)} x ${i.quantity} — ${money(i.price * i.quantity)}</li>`).join('')}
          </ul>
          <p class="mb-1">Total: <strong>${money(o.totalAmount)}</strong> · Payment: ${o.paymentStatus}</p>
          <div class="d-flex gap-2 flex-wrap">
            ${o.paymentStatus === 'Pending' && o.status !== 'Cancelled' ? `<button class="btn btn-sm btn-outline-success" data-pay="${o._id}">Pay Now (mock)</button>` : ''}
            ${o.status === 'Delivered' ? o.items.map((i) => `<button class="btn btn-sm btn-outline-warning" data-review="${i.productId}" data-order="${o._id}">Review "${escapeHtml(i.name)}"</button>`).join('') : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<p class="text-danger">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('ordersList').addEventListener('click', async (e) => {
  const payBtn = e.target.closest('[data-pay]');
  if (payBtn) {
    try {
      await api.post(`/payments/${payBtn.dataset.pay}/mock-charge`);
      toast('Payment successful (mock)', 'success');
      loadOrders();
    } catch (err) {
      toast(err.message, 'danger');
    }
    return;
  }
  const reviewBtn = e.target.closest('[data-review]');
  if (reviewBtn) {
    const form = document.getElementById('reviewForm');
    form.dataset.productId = reviewBtn.dataset.review;
    form.orderId.value = reviewBtn.dataset.order;
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
  }
});

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  try {
    await api.post(`/products/${form.dataset.productId}/reviews`, {
      orderId: fd.get('orderId'),
      rating: Number(fd.get('rating')),
      comment: fd.get('comment'),
    });
    toast('Review submitted', 'success');
    closeAllModals();
    form.reset();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// ---------- seller dashboard ----------

async function loadSellerDashboard() {
  const statsEl = document.getElementById('sellerStats');
  const productsEl = document.getElementById('sellerProducts');
  const ordersEl = document.getElementById('sellerOrders');
  statsEl.innerHTML = productsEl.innerHTML = ordersEl.innerHTML = `<p class="text-muted">Loading...</p>`;

  try {
    const [summary, { products }, { orders }] = await Promise.all([
      api.get('/seller/dashboard/summary'),
      api.get(`/products?sellerId=${getUser()?._id || ''}&limit=100`).catch(() => ({ products: [] })),
      api.get('/orders'),
    ]);

    statsEl.innerHTML = [
      ['Active Products', summary.productCount],
      ['Low Stock', summary.lowStockCount],
      ['Total Revenue', money(summary.totalRevenue)],
      ['Order Lines', summary.totalOrderLines],
    ].map(([label, val]) => `
      <div class="col-sm-6 col-lg-3">
        <div class="card stat-card"><div class="card-body">
          <div class="small text-muted">${label}</div>
          <div class="fs-4 fw-bold">${val}</div>
        </div></div>
      </div>`).join('');

    await loadCategoriesInto(document.getElementById('productCategorySelect'), { includeBlank: false });

    productsEl.innerHTML = products.length ? `<div class="table-responsive"><table class="table table-sm align-middle">
      <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th></th></tr></thead>
      <tbody>${products.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${money(p.price)}</td>
          <td class="${p.stock <= 5 ? 'low-stock' : ''}">${p.stock}</td>
          <td><button class="btn btn-sm btn-outline-danger" data-del-product="${p._id}">Delete</button></td>
        </tr>`).join('')}</tbody>
    </table></div>` : `<p class="text-muted">You haven't listed any products yet.</p>`;

    ordersEl.innerHTML = orders.length ? orders.map((o) => `
      <div class="card mb-2"><div class="card-body">
        <div class="d-flex justify-content-between">
          <strong>Order #${o._id.slice(-6)}</strong>
          ${statusBadge(o.status)}
        </div>
        <ul class="small mb-2">${o.items.map((i) => `<li>${escapeHtml(i.name)} x ${i.quantity}</li>`).join('')}</ul>
        <div class="d-flex gap-2">
          ${nextStatusOptions(o.status).map((s) => `<button class="btn btn-sm btn-outline-primary" data-set-status="${o._id}" data-status="${s}">Mark ${s}</button>`).join('')}
        </div>
      </div></div>`).join('') : `<p class="text-muted">No orders yet.</p>`;
  } catch (err) {
    statsEl.innerHTML = `<p class="text-danger">${escapeHtml(err.message)}</p>`;
  }
}

function nextStatusOptions(status) {
  const graph = { Placed: ['Confirmed', 'Cancelled'], Confirmed: ['Shipped', 'Cancelled'], Shipped: ['Delivered'], Delivered: [], Cancelled: [] };
  return graph[status] || [];
}

document.getElementById('sellerOrders').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-set-status]');
  if (!btn) return;
  try {
    await api.put(`/orders/${btn.dataset.setStatus}/status`, { status: btn.dataset.status, remarks: 'Updated via seller dashboard' });
    toast('Order status updated', 'success');
    loadSellerDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('sellerProducts').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-del-product]');
  if (!btn) return;
  if (!confirm('Delete this product?')) return;
  try {
    await api.del(`/products/${btn.dataset.delProduct}`);
    toast('Product removed', 'success');
    loadSellerDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api.post('/products', {
      name: fd.get('name'),
      description: fd.get('description'),
      categoryId: fd.get('categoryId'),
      price: Number(fd.get('price')),
      stock: Number(fd.get('stock')),
    });
    toast('Product created', 'success');
    closeAllModals();
    e.target.reset();
    loadSellerDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// ---------- admin console ----------

async function loadAdminDashboard() {
  const statsEl = document.getElementById('adminStats');
  const catEl = document.getElementById('adminCategories');
  const ordersEl = document.getElementById('adminOrders');
  const couponsEl = document.getElementById('adminCoupons');
  statsEl.innerHTML = catEl.innerHTML = ordersEl.innerHTML = couponsEl.innerHTML = `<p class="text-muted">Loading...</p>`;

  try {
    const [sales, users, categories, { orders }, coupons] = await Promise.all([
      api.get('/admin/reports/sales'),
      api.get('/admin/reports/users'),
      api.get('/categories'),
      api.get('/orders'),
      api.get('/coupons'),
    ]);

    statsEl.innerHTML = [
      ['Total Revenue', money(sales.totalRevenue)],
      ['Total Orders', sales.totalOrders],
      ['Discount Given', money(sales.totalDiscountGiven)],
      ['Registered Users', users.byRole.reduce((s, r) => s + r.count, 0)],
    ].map(([label, val]) => `
      <div class="col-sm-6 col-lg-3">
        <div class="card stat-card"><div class="card-body">
          <div class="small text-muted">${label}</div>
          <div class="fs-4 fw-bold">${val}</div>
        </div></div>
      </div>`).join('');

    categoriesCache = categories.categories;
    catEl.innerHTML = `<ul class="list-group">` + categoriesCache.map((c) => `
      <li class="list-group-item d-flex justify-content-between">
        ${escapeHtml(c.name)}
        <button class="btn btn-sm btn-outline-danger" data-del-cat="${c._id}">Delete</button>
      </li>`).join('') + `</ul>`;

    await loadCategoriesInto(document.getElementById('parentCategorySelect'), { includeBlank: true, blankLabel: 'None' });

    ordersEl.innerHTML = orders.length ? `<div class="table-responsive"><table class="table table-sm">
      <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${orders.map((o) => `
        <tr><td>#${o._id.slice(-6)}</td><td>${money(o.totalAmount)}</td><td>${statusBadge(o.status)}</td><td>${o.paymentStatus}</td></tr>`).join('')}</tbody>
    </table></div>` : `<p class="text-muted">No orders yet.</p>`;

    couponsEl.innerHTML = coupons.coupons.length ? `<div class="table-responsive"><table class="table table-sm">
      <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Valid Till</th><th>Active</th></tr></thead>
      <tbody>${coupons.coupons.map((c) => `
        <tr><td>${escapeHtml(c.code)}</td><td>${c.discountType}</td><td>${c.value}</td><td>${new Date(c.validTill).toLocaleDateString()}</td><td>${c.isActive ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody>
    </table></div>` : `<p class="text-muted">No coupons yet.</p>`;
  } catch (err) {
    statsEl.innerHTML = `<p class="text-danger">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('adminCategories').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-del-cat]');
  if (!btn) return;
  if (!confirm('Delete this category?')) return;
  try {
    await api.del(`/categories/${btn.dataset.delCat}`);
    toast('Category deleted', 'success');
    categoriesCache = [];
    loadAdminDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api.post('/categories', {
      name: fd.get('name'),
      parentCategoryId: fd.get('parentCategoryId') || undefined,
    });
    toast('Category created', 'success');
    closeAllModals();
    e.target.reset();
    categoriesCache = [];
    loadAdminDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

document.getElementById('couponForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api.post('/coupons', {
      code: fd.get('code'),
      discountType: fd.get('discountType'),
      value: Number(fd.get('value')),
      validTill: fd.get('validTill'),
      minOrderValue: Number(fd.get('minOrderValue') || 0),
    });
    toast('Coupon created', 'success');
    closeAllModals();
    e.target.reset();
    loadAdminDashboard();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

// ---------- init ----------

refreshNav();
showView('catalog');

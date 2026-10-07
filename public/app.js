let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let allProducts = [];
let activeFilter = 'All';

const $ = s => document.querySelector(s);

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0); }
function logout() { localStorage.clear(); location.reload(); }
function toggleCart() { $('#cartDrawer').classList.toggle('open'); renderCart(); }

function finalPrice(p) { return Math.round(p.price * (1 - (p.discount || 0) / 100)); }

function toast(msg) {
  let t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#0f172a;color:#c9a227;padding:12px 26px;border-radius:30px;z-index:200;box-shadow:0 8px 20px rgba(0,0,0,.3);font-weight:600';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

async function loadSite() {
  const c = await (await fetch('/api/content')).json();
  const hero = $('#home');
  if (c.heroTitle) hero.querySelector('h1').textContent = c.heroTitle;
  if (c.heroSubtitle) hero.querySelector('p').textContent = c.heroSubtitle;
  if (c.heroImage) hero.style.backgroundImage = `linear-gradient(rgba(15,23,42,.65),rgba(15,23,42,.65)),url('${c.heroImage}')`;
  if (c.about) $('#about p').textContent = c.about;
  if (c.videoUrl) $('#brandVideo source').src = c.videoUrl;
  if (c.upcomingTitle) $('#upcoming p').textContent = c.upcomingTitle;
  if (c.phone) $('#topPhone').textContent = '📞 ' + c.phone;
  if (c.address) $('#topAddress').textContent = '📍 ' + c.address;
  if (c.siteName) { $('#siteName').textContent = c.siteName; document.title = c.siteName + ' — Premium Garments'; }
  const pl = await (await fetch('/api/plugins')).json();
  $('#home').style.display = pl.hero ? '' : 'none';
  document.querySelector('.stats') && (document.querySelector('.stats').style.display = pl.stats ? '' : 'none');
  $('#video').style.display = pl.video ? '' : 'none';
  $('#upcoming').style.display = pl.upcoming ? '' : 'none';
  window.__plugins = pl;
  renderProducts();
}

async function loadProducts() {
  allProducts = await (await fetch('/api/products')).json();
  renderProducts();
}

function renderProducts() {
  const q = ($('#searchInput')?.value || '').toLowerCase();
  let list = allProducts.filter(p =>
    (activeFilter === 'All' || p.gender === activeFilter || p.category === activeFilter) &&
    (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  $('#products').innerHTML = list.map(p => `
  <div class="card" onclick="showProduct(${p.id})" style="cursor:pointer">
    ${p.badge && window.__plugins?.badges !== false ? `<span class="badge-tag">${p.badge}</span>` : ''}
    <img src="${p.image}" alt="${p.name}">
    <div class="card-body">
      <div class="cat">${p.category} • ${p.gender}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.description}</p>
      ${window.__plugins?.ratings !== false ? `<div class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))} ${p.rating}</div>` : ''}
      <div class="price-row">
        <span class="price">৳${finalPrice(p)} <s style="color:#94a3b8;font-size:13px">৳${p.price}</s> <b style="color:#dc2626;font-size:13px">-${p.discount || 0}%</b></span>
        <button onclick="event.stopPropagation();addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  </div>`).join('') || '<p>No products found.</p>';
}

function showProduct(id) {
  const p = allProducts.find(x => x.id === id); if (!p) return;
  let m = document.getElementById('pmodal');
  if (!m) { m = document.createElement('div'); m.id = 'pmodal'; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:300';
  m.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:520px;width:92%;padding:24px;position:relative">
    <button onclick="document.getElementById('pmodal').remove()" style="position:absolute;top:12px;right:14px;background:#0f172a">✕</button>
    <img src="${p.image}" style="width:100%;height:260px;object-fit:cover;border-radius:12px">
    <h2 style="margin:12px 0 4px">${p.name}</h2>
    <div style="color:#64748b;font-size:13px">${p.category} • ${p.gender} • Stock: ${p.stock}</div>
    <div style="color:#f59e0b;margin:6px 0">${'★'.repeat(Math.round(p.rating))} ${p.rating}</div>
    <p style="color:#475569">${p.description}</p>
    <div style="margin:12px 0"><b style="color:#c9a227;font-size:24px">৳${finalPrice(p)}</b> <s style="color:#94a3b8">৳${p.price}</s> <b style="color:#dc2626">-${p.discount || 0}% OFF</b></div>
    <button style="width:100%" onclick="addToCart(${p.id});document.getElementById('pmodal').remove()">Add to Cart</button>
  </div>`;
}

function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  const match = [...document.querySelectorAll('.filters button')].find(b => b.getAttribute('onclick')?.includes(`'${f}'`));
  (el || match)?.classList.add('active');
  renderProducts();
}

async function addToCart(id) {
  const p = await (await fetch('/api/products/' + id)).json();
  const item = cart.find(i => i.id === p.id);
  item ? item.qty++ : cart.push({ ...p, qty: 1, final: finalPrice(p) });
  saveCart();
  toast(p.name + ' added to cart ✓');
}

function renderCart() {
  $('#cartItems').innerHTML = cart.map(i => `
    <div class="cart-item">
      <div><b>${i.name}</b><br><small>৳${i.final || finalPrice(i)} × ${i.qty}</small></div>
      <div>৳${(i.final || finalPrice(i)) * i.qty} <button onclick="removeFromCart(${i.id})">✕</button></div>
    </div>`).join('') || '<p>Your cart is empty</p>';
  $('#total').textContent = cart.reduce((s, i) => s + (i.final || finalPrice(i)) * i.qty, 0);
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCart(); }

async function checkout() {
  if (!token) return alert('Please login first');
  if (!cart.length) return alert('Cart is empty');
  const me = await (await fetch('/api/profile', { headers: { Authorization: 'Bearer ' + token } })).json();
  if (!me.paymentType) return alert('Please add a payment type in your Profile first');
  const pays = await (await fetch('/api/payments')).json();
  const choice = prompt(`Your registered payment: ${me.paymentType} (${me.payNumber || ''})\n\nChoose payment method:\n` + pays.map((p, i) => `${i + 1}. ${p.name}`).join('\n'));
  const pm = pays[+choice - 1];
  if (!pm) return;
  // payment verification
  const code = String(Math.floor(100000 + Math.random() * 900000));
  alert(`Payment verification code sent to your phone/email (demo code: ${code})`);
  const entered = prompt('Enter verification code to confirm payment:');
  if (entered !== code) return alert('Verification failed. Payment cancelled.');
  const total = cart.reduce((s, i) => s + (i.final || finalPrice(i)) * i.qty, 0);
  const res = await fetch('/api/orders', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ items: cart, total, payment: pm.name, verified: true }) });
  if (res.ok) { alert(`Payment verified & order placed via ${pm.name}! 🎉`); cart = []; saveCart(); renderCart(); toggleCart(); }
}

const target = Date.now() + 7 * 24 * 60 * 60 * 1000;
setInterval(() => {
  const d = target - Date.now(); const el = $('#countdown'); if (!el) return;
  if (window.__plugins && window.__plugins.countdown === false) { el.parentElement.style.display = 'none'; return; }
  el.innerHTML = `<div><b>${Math.floor(d / 864e5)}</b>Days</div><div><b>${Math.floor(d / 36e5) % 24}</b>Hrs</div><div><b>${Math.floor(d / 6e4) % 60}</b>Min</div><div><b>${Math.floor(d / 1e3) % 60}</b>Sec</div>`;
}, 1000);

function init() {
  $('#profileDrop').innerHTML = user
    ? `<a href="/profile.html">👤 Manage My Account</a>
       <a href="/profile.html#orders">📦 My Orders</a>
       <a href="#" onclick="alert('Wishlist coming soon')">❤️ My Wishlist</a>
       <a href="#" onclick="alert('No reviews yet')">⭐ My Reviews</a>
       <a href="#" onclick="alert('No returns')">↩️ My Returns & Cancellations</a>
       ${(user.role === 'admin' || user.role === 'superadmin' || user.role === 'editor') ? '<a href="/admin.html">⚙️ Admin Panel</a>' : ''}
       <a onclick="logout()">🚪 Logout</a>`
    : `<a href="/login.html">🔑 Login</a><a href="/register.html">✨ Signup</a>`;
  if (user) {
    fetch('/api/profile', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(u => {
        if (u.avatar) document.getElementById('navAvatar').src = u.avatar;
        else document.getElementById('navAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=c9a227&color=fff&size=64`;
      }).catch(() => {});
  } else {
    document.getElementById('navAvatar').src = 'https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff&size=64';
  }
  saveCart(); loadSite(); loadProducts(); renderCart();
  $('#searchInput')?.addEventListener('input', renderProducts);
  if (user) { /* profile link added below */ }
}
init();

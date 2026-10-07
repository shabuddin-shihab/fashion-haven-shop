const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!token || (user?.role !== 'admin' && user?.role !== 'superadmin' && user?.role !== 'editor')) { alert('Staff login required'); location.href = '/login.html'; }

const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

function show(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

async function load() {
  const products = await (await fetch('/api/products')).json();
  const orders = await (await fetch('/api/orders', { headers: H })).json().catch(() => []);
  document.querySelector('#prows').innerHTML = products.map(p => `
    <tr><td>${p.name}</td><td>৳${p.price}</td>
    <td><input type="number" id="disc-${p.id}" value="${p.discount || 0}" style="width:70px;margin:0"> <button onclick="setDiscount(${p.id})">Set</button></td>
    <td>${p.category}</td><td>${p.stock}</td>
    <td><button class="danger" onclick="delProduct(${p.id})">Delete</button></td></tr>`).join('');
  document.querySelector('#orows').innerHTML = (orders || []).map(o => `
    <tr><td>${o.id}</td><td>${o.items.map(i => i.name + ' ×' + i.qty).join(', ')}</td><td>${o.payment || '-'}</td><td>৳${o.total}</td><td>${new Date(o.date).toLocaleString()}</td></tr>`).join('') || '<tr><td colspan="5">No orders</td></tr>';
  document.querySelector('#stats').innerHTML = `
    <div class="stat-card"><b>${products.length}</b>Products</div>
    <div class="stat-card"><b>${(orders || []).length}</b>Orders</div>
    <div class="stat-card"><b>৳${(orders || []).reduce((s, o) => s + o.total, 0)}</b>Revenue</div>
    <div class="stat-card"><b>${user.role}</b>Your Role</div>`;
  // content
  const c = await (await fetch('/api/content')).json();
  cSiteName.value = c.siteName || '';
  cHeroTitle.value = c.heroTitle || ''; cHeroSubtitle.value = c.heroSubtitle || '';
  cHeroImage.value = c.heroImage || ''; cAbout.value = c.about || '';
  cVideoUrl.value = c.videoUrl || ''; cUpcomingTitle.value = c.upcomingTitle || '';
  cPhone.value = c.phone || ''; cAddress.value = c.address || '';
  // payments
  const pays = await (await fetch('/api/payments')).json();
  payrows.innerHTML = pays.map(p => `<tr><td>${p.name}</td><td>${p.type}</td><td><button class="danger" onclick="delPay(${p.id})">Delete</button></td></tr>`).join('');
  // plugins
  const pl = await (await fetch('/api/plugins')).json();
  plHero.checked = pl.hero; plStats.checked = pl.stats; plVideo.checked = pl.video; plUpcoming.checked = pl.upcoming;
  plCountdown.checked = pl.countdown !== false; plRatings.checked = pl.ratings !== false; plBadges.checked = pl.badges !== false; plSidebarLinks.checked = pl.sidebarLinks !== false;
  // settings (superadmin only)
  if (user.role === 'superadmin') {
    const users = await (await fetch('/api/users', { headers: H })).json();
    urows.innerHTML = users.map(u => `
      <tr><td>${u.name}</td><td>${u.email}</td>
      <td><select id="role-${u.id}">${['user', 'editor', 'admin', 'superadmin'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
      <td><button onclick="setRole(${u.id})">Save</button></td></tr>`).join('');
    const roles = await (await fetch('/api/roles', { headers: H })).json();
    const allPerms = ['products', 'orders', 'content', 'payments', 'plugins', 'settings'];
    rolesBox.innerHTML = Object.entries(roles).map(([r, perms]) => `
      <div style="margin-bottom:12px"><b>${r}:</b><br>${allPerms.map(p => `
      <label class="perm"><input type="checkbox" data-role="${r}" value="${p}" ${perms.includes(p) || perms.includes('*') ? 'checked' : ''}>${p}</label>`).join('')}</div>`).join('');
  } else {
    document.querySelector('#settings').innerHTML = '<h3>Settings</h3><p>🔒 Only Super Admin can access settings.</p>';
  }
}

async function setDiscount(id) {
  const v = +document.getElementById('disc-' + id).value || 0;
  await fetch('/api/products/' + id, { method: 'PUT', headers: H, body: JSON.stringify({ discount: v }) });
  load();
}
async function delProduct(id) { await fetch('/api/products/' + id, { method: 'DELETE', headers: H }); load(); }
function previewImg() {
  const f = pimageFile.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => { ppreview.src = r.result; ppreview.style.display = ''; }; r.readAsDataURL(f);
}
async function delPay(id) { await fetch('/api/payments/' + id, { method: 'DELETE', headers: H }); load(); }
async function setRole(id) {
  await fetch('/api/users/' + id + '/role', { method: 'PUT', headers: H, body: JSON.stringify({ role: document.getElementById('role-' + id).value }) });
  alert('Role updated');
}

document.querySelector('#pf').onsubmit = async e => {
  e.preventDefault();
  await fetch('/api/products', { method: 'POST', headers: H, body: JSON.stringify({
    name: pname.value, price: +pprice.value, category: pcategory.value, gender: pgender.value,
    image: ppreview.src && ppreview.style.display !== 'none' ? ppreview.src : pimage.value, description: pdesc.value, stock: +pstock.value, discount: +pdiscount.value, badge: pbadge.value
  })});
  e.target.reset(); load();
};

document.querySelector('#cf').onsubmit = async e => {
  e.preventDefault();
  await fetch('/api/content', { method: 'PUT', headers: H, body: JSON.stringify({
    heroTitle: cHeroTitle.value, heroSubtitle: cHeroSubtitle.value, heroImage: cHeroImage.value, siteName: cSiteName.value,
    about: cAbout.value, videoUrl: cVideoUrl.value, upcomingTitle: cUpcomingTitle.value,
    phone: cPhone.value, address: cAddress.value
  })});
  alert('Website updated! Refresh the shop page to see changes.');
};

document.querySelector('#payf').onsubmit = async e => {
  e.preventDefault();
  await fetch('/api/payments', { method: 'POST', headers: H, body: JSON.stringify({ name: payName.value, type: payType.value }) });
  e.target.reset(); load();
};

async function savePlugins() {
  await fetch('/api/plugins', { method: 'PUT', headers: H, body: JSON.stringify({ hero: plHero.checked, stats: plStats.checked, video: plVideo.checked, upcoming: plUpcoming.checked, countdown: plCountdown.checked, ratings: plRatings.checked, badges: plBadges.checked, sidebarLinks: plSidebarLinks.checked }) });
  alert('Plugins saved!');
}

async function saveRoles() {
  const roles = {};
  document.querySelectorAll('#rolesBox input[type=checkbox]').forEach(cb => {
    roles[cb.dataset.role] = roles[cb.dataset.role] || [];
    if (cb.checked) roles[cb.dataset.role].push(cb.value);
  });
  if (roles.superadmin && !roles.superadmin.includes('*')) roles.superadmin = ['*'];
  await fetch('/api/roles', { method: 'PUT', headers: H, body: JSON.stringify(roles) });
  alert('Permissions saved!');
}

load();

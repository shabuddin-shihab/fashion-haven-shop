const express = require('express');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

const sessions = {};

function hash(pw) { return crypto.createHash('sha256').update(pw).digest('hex'); }

function getUser(req) {
  const token = (req.headers.authorization || '').split(' ')[1];
  return sessions[token] || null;
}

function hasPerm(user, perm) {
  if (!user) return false;
  const perms = db.load().roles[user.role] || [];
  return perms.includes('*') || perms.includes(perm);
}

function need(perm) {
  return (req, res, next) => {
    const user = getUser(req);
    if (!hasPerm(user, perm)) return res.status(403).json({ error: 'Permission denied' });
    req.user = user; next();
  };
}

// ---------- Auth ----------
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const data = db.load();
  if (data.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const allowed = ['user', 'admin', 'editor', 'superadmin'];
  data.users.push({ id: Date.now(), name, email, password: hash(password), role: allowed.includes(role) ? role : 'user' });
  db.save(data);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.load().users.find(u => u.email === email && u.password === hash(password));
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomBytes(16).toString('hex');
  sessions[token] = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token, user: sessions[token] });
});

app.get('/api/me', (req, res) => {
  const u = getUser(req);
  u ? res.json(u) : res.status(401).json({ error: 'Not logged in' });
});

// ---------- Products ----------
app.get('/api/products', (req, res) => res.json(db.load().products));
app.get('/api/products/:id', (req, res) => {
  const p = db.load().products.find(p => p.id == req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/products', need('products'), (req, res) => {
  const data = db.load();
  const p = { id: Date.now(), rating: 4, badge: '', discount: 0, ...req.body };
  data.products.push(p); db.save(data); res.json(p);
});
app.put('/api/products/:id', need('products'), (req, res) => {
  const data = db.load();
  const i = data.products.findIndex(p => p.id == req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  data.products[i] = { ...data.products[i], ...req.body };
  db.save(data); res.json(data.products[i]);
});
app.delete('/api/products/:id', need('products'), (req, res) => {
  const data = db.load();
  data.products = data.products.filter(p => p.id != req.params.id);
  db.save(data); res.json({ ok: true });
});

// ---------- Content (website text/design) ----------
app.get('/api/content', (req, res) => res.json(db.load().content));
app.put('/api/content', need('content'), (req, res) => {
  const data = db.load();
  data.content = { ...data.content, ...req.body };
  db.save(data); res.json(data.content);
});

// ---------- Plugins ----------
app.get('/api/plugins', (req, res) => res.json(db.load().plugins));
app.put('/api/plugins', need('plugins'), (req, res) => {
  const data = db.load();
  data.plugins = { ...data.plugins, ...req.body };
  db.save(data); res.json(data.plugins);
});

// ---------- Payments ----------
app.get('/api/payments', (req, res) => res.json(db.load().payments));
app.post('/api/payments', need('payments'), (req, res) => {
  const data = db.load();
  const p = { id: Date.now(), ...req.body };
  data.payments.push(p); db.save(data); res.json(p);
});
app.delete('/api/payments/:id', need('payments'), (req, res) => {
  const data = db.load();
  data.payments = data.payments.filter(p => p.id != req.params.id);
  db.save(data); res.json({ ok: true });
});

// ---------- Roles & Settings (superadmin) ----------
app.get('/api/roles', need('settings'), (req, res) => res.json(db.load().roles));
app.put('/api/roles', need('settings'), (req, res) => {
  const data = db.load();
  data.roles = req.body; db.save(data); res.json(data.roles);
});
app.get('/api/users', need('settings'), (req, res) => {
  res.json(db.load().users.map(({ password, ...u }) => u));
});
app.put('/api/users/:id/role', need('settings'), (req, res) => {
  const data = db.load();
  const u = data.users.find(u => u.id == req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  u.role = req.body.role; db.save(data); res.json({ ok: true });
});

// ---------- Super Admin page & forgot password ----------
app.get('/superadmin', (req, res) => res.sendFile(__dirname + '/public/superadmin.html'));

app.post('/api/forgot', (req, res) => {
  const data = db.load();
  const u = data.users.find(u => u.email === req.body.email && u.role === 'superadmin');
  if (!u) return res.status(404).json({ error: 'Super Admin email not found' });
  u.password = hash(req.body.password);
  db.save(data);
  res.json({ ok: true });
});

// ---------- Social Signup/Login (demo) ----------
app.post('/api/social', (req, res) => {
  const { provider, name, email } = req.body;
  const data = db.load();
  let u = data.users.find(u => u.email === email);
  if (!u) {
    u = { id: Date.now(), name, email, password: hash(provider + Date.now()), role: 'user', provider };
    data.users.push(u); db.save(data);
  }
  const token = crypto.randomBytes(16).toString('hex');
  sessions[token] = { id: u.id, name: u.name, email: u.email, role: u.role };
  res.json({ token, user: sessions[token] });
});

app.get('/api/myorders', (req, res) => {
  const s = getUser(req);
  if (!s) return res.status(401).json({ error: 'Login required' });
  res.json(db.load().orders.filter(o => o.userId === s.id));
});

// ---------- Profile ----------
app.get('/api/profile', (req, res) => {
  const s = getUser(req);
  if (!s) return res.status(401).json({ error: 'Login required' });
  const u = db.load().users.find(u => u.id === s.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { password, ...safe } = u;
  res.json(safe);
});

app.put('/api/profile', (req, res) => {
  const s = getUser(req);
  if (!s) return res.status(401).json({ error: 'Login required' });
  const data = db.load();
  const u = data.users.find(u => u.id === s.id);
  ['name', 'phone', 'address', 'lat', 'lng', 'paymentType', 'payName', 'payNumber', 'avatar', 'payCard', 'payBank'].forEach(k => {
    if (req.body[k] !== undefined) u[k] = req.body[k];
  });
  db.save(data);
  if (sessions[Object.keys(sessions).find(t => sessions[t].id === s.id)]) sessions[Object.keys(sessions).find(t => sessions[t].id === s.id)].name = u.name;
  res.json({ ok: true });
});

// ---------- Email/Phone verification (demo codes) ----------
app.post('/api/verify/send', (req, res) => {
  const s = getUser(req);
  if (!s) return res.status(401).json({ error: 'Login required' });
  const data = db.load();
  const u = data.users.find(u => u.id === s.id);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  u.codes = u.codes || {};
  u.codes[req.body.type] = code;
  db.save(data);
  res.json({ ok: true, demoCode: code, message: `Code sent to your ${req.body.type === 'email' ? 'email' : 'phone'} (demo: ${code})` });
});

app.post('/api/verify/check', (req, res) => {
  const s = getUser(req);
  if (!s) return res.status(401).json({ error: 'Login required' });
  const data = db.load();
  const u = data.users.find(u => u.id === s.id);
  if (u.codes && u.codes[req.body.type] === req.body.code) {
    u.verified = u.verified || {};
    u.verified[req.body.type] = true;
    delete u.codes[req.body.type];
    db.save(data);
    return res.json({ ok: true });
  }
  res.status(400).json({ error: 'Wrong code' });
});

// ---------- Orders ----------
app.post('/api/orders', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const data = db.load();
  const order = { id: Date.now(), userId: user.id, items: req.body.items, total: req.body.total, payment: req.body.payment, verified: !!req.body.verified, date: new Date().toISOString() };
  data.orders.push(order); db.save(data); res.json(order);
});
app.get('/api/orders', need('orders'), (req, res) => res.json(db.load().orders));

app.listen(3000, () => console.log('Server running: http://localhost:3000'));

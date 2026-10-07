const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'db.json');

const seed = {
  users: [],
  products: [
    { id: 1, name: 'Classic Cotton Panjabi', price: 1450, discount: 10, category: 'Panjabi', gender: 'Men', image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=500', description: 'Premium cotton panjabi for every occasion', stock: 40, rating: 4.5, badge: 'Best Seller' },
    { id: 2, name: 'Elegant Sharee', price: 2800, discount: 0, category: 'Sharee', gender: 'Women', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500', description: 'Handcrafted elegant sharee with intricate design', stock: 25, rating: 4.8, badge: 'New' },
    { id: 3, name: 'Kids T-Shirt Set', price: 650, discount: 15, category: 'T-Shirt', gender: 'Kids', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500', description: 'Soft and colorful t-shirt set for kids', stock: 60, rating: 4.3, badge: '' },
    { id: 4, name: 'Ladies Kurti', price: 950, discount: 20, category: 'Kurti', gender: 'Women', image: 'https://images.unsplash.com/photo-1616627988858-f94183a82356?w=500', description: 'Comfortable daily-wear kurti', stock: 35, rating: 4.4, badge: 'Sale' },
    { id: 5, name: 'Men Denim Jacket', price: 2100, discount: 0, category: 'Jacket', gender: 'Men', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', description: 'Rugged denim jacket, modern fit', stock: 18, rating: 4.6, badge: 'Trending' },
    { id: 6, name: 'Senior Cotton Shirt', price: 1200, discount: 5, category: 'Shirt', gender: 'Old', image: 'https://images.unsplash.com/photo-1596541223130-5d31a289e48?w=500', description: 'Comfortable breathable cotton shirt', stock: 22, rating: 4.2, badge: '' },
    { id: 7, name: 'Girls Frock', price: 850, discount: 0, category: 'Frock', gender: 'Kids', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500', description: 'Beautiful party frock for girls', stock: 30, rating: 4.7, badge: 'New' },
    { id: 8, name: 'Ladies Handbag Set', price: 1750, discount: 12, category: 'Accessories', gender: 'Women', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', description: 'Stylish matching handbag set', stock: 15, rating: 4.5, badge: '' }
  ],
  orders: [],
  content: {
    heroTitle: 'Style for Everyone',
    heroSubtitle: 'Premium garments for Men • Women • Kids • and All Ages',
    heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400',
    about: 'Fashion Haven is a premium garment brand dedicated to delivering quality, comfort, and style.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    upcomingTitle: 'Exclusive Eid Collection 2026 — Stay tuned!',
    upcomingDate: '',
    phone: '+880 1700-000000',
    address: 'House 12, Road 5, Mirpur 10, Dhaka'
  },
  payments: [
    { id: 1, name: 'bKash', type: 'Mobile Banking' },
    { id: 2, name: 'Nagad', type: 'Mobile Banking' },
    { id: 3, name: 'Rocket', type: 'Mobile Banking' },
    { id: 4, name: 'CellFin', type: 'Mobile Banking' },
    { id: 5, name: 'Visa', type: 'International Card' },
    { id: 6, name: 'MasterCard', type: 'International Card' },
    { id: 7, name: 'PayPal', type: 'International' },
    { id: 8, name: 'Bank Transfer', type: 'International' }
  ],
  plugins: { stats: true, video: true, upcoming: true, hero: true },
  roles: {
    superadmin: ['*'],
    admin: ['products', 'orders', 'content'],
    editor: ['content']
  }
};

function load() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  for (const k of Object.keys(seed)) if (!(k in data)) data[k] = seed[k];
  return data;
}

function save(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

module.exports = { load, save };

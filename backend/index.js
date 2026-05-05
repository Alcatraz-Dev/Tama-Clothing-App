const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ==================== FIREBASE ====================
let db = null;
let firebaseReady = false;

async function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    firebaseReady = true;
    return;
  }

  try {
    let sa;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let s = process.env.FIREBASE_SERVICE_ACCOUNT;
      // Handle both escaped and unescaped newlines
      s = s.replace(/\\n/g, '\n');
      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
      sa = JSON.parse(s);
    } else {
      sa = require('./serviceAccountKey.json');
    }
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    db = admin.firestore();
    firebaseReady = true;
  } catch (e) {
    console.error('Firebase init error:', e.message);
  }
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json());

// ==================== ROUTES (deferred until after Firebase init) ====================
app.get('/', (req, res) => res.send('Tama API'));

// ==================== UPLOAD ====================
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'tama-clothing/avatars', allowed_formats: ['jpg', 'png', 'jpeg'] }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: req.file.path });
});

app.post('/api/orders', async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const { customer, items, total, paymentMethod } = req.body;
    if (!customer || !items || !total) return res.status(400).json({ error: 'Missing fields' });
    
    const orderData = {
      customer, items, total,
      paymentMethod: paymentMethod || 'COD',
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('orders').add(orderData);
    res.json({ success: true, orderId: docRef.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== EXPORTS ====================
module.exports = app;

module.exports.getDB = () => { if (!firebaseReady) throw new Error('Firebase not ready'); return db; };
module.exports.isReady = () => firebaseReady;
module.exports.getAdmin = () => admin;

// ==================== START ====================
initFirebase().then(() => {
  // Initialize routes after Firebase is ready
  app.use('/api/payment', require('./payment-routes'));
  app.use('/api/treasure', require('./treasure-routes'));
  
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
});
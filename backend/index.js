const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tama-clothing/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin
let db = null;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ CRITICAL: Firebase Admin could not be initialized.');
  console.error('Reason: serviceAccountKey.json is missing or invalid.');
  console.log('Action: Please add serviceAccountKey.json to the backend folder.');
}

// Routes
app.get('/', (req, res) => {
  res.send('Tama Clothing API is running...');
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Endpoint to create an order
app.post('/api/orders', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Backend is waiting for serviceAccountKey.json configuration.' });
  }

  try {
    const { customer, items, total, paymentMethod } = req.body;

    if (!customer || !items || !total) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderData = {
      customer,
      items,
      total,
      paymentMethod: paymentMethod || 'COD',
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection('orders').add(orderData);

    res.status(201).json({ 
      success: true, 
      orderId: orderRef.id,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for Dashboard Stats (Admin Only)
app.get('/api/stats', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const ordersSnap = await db.collection('orders').get();
    const productsSnap = await db.collection('products').get();
    
    let totalRevenue = 0;
    ordersSnap.forEach(doc => {
      totalRevenue += doc.data().total || 0;
    });

    res.json({
      totalOrders: ordersSnap.size,
      totalProducts: productsSnap.size,
      totalRevenue: totalRevenue.toFixed(3),
      recentOrders: ordersSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

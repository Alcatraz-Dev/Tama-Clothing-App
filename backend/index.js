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

// Import payment routes
const paymentRoutes = require('./payment-routes');

// Import treasure hunt routes
const treasureRoutes = require('./treasure-routes');

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

// Payment Routes
app.use('/api/payment', paymentRoutes);

// Treasure Hunt Routes
app.use('/api/treasure', treasureRoutes);

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

// Get all products
app.get('/api/products', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const { limit = 50, categoryId, brandId, search } = req.query;
    let query = db.collection('products');
    
    // Filter by active status if exists
    query = query.where('isActive', '==', true);
    
    const snap = await query.get();
    let products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Client-side filtering for category and brand (Firestore limitations)
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }
    if (brandId) {
      products = products.filter(p => p.brandId === brandId);
    }
    if (search) {
      const searchLower = search.toString().toLowerCase();
      products = products.filter(p => {
        const name = (p.name?.fr || p.name?.['ar-tn'] || p.name?.en || '').toString().toLowerCase();
        return name.includes(searchLower);
      });
    }
    
    // Apply limit
    products = products.slice(0, parseInt(limit));
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const snap = await db.collection('categories').get();
    const categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all brands
app.get('/api/brands', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const snap = await db.collection('brands').get();
    let brands = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filter active brands
    brands = brands.filter(b => b.isActive !== false);
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

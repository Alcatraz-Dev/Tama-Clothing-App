const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Initialize Firestore (will use the initialized db from index.js)
let db = null;

// Helper to get db (called after admin is initialized)
const getDb = () => {
  if (!db && admin.firestore) {
    db = admin.firestore();
  }
  return db;
};

// ============================================
// CAMPAIGN ROUTES
// ============================================

// GET /api/treasure/campaigns - List all campaigns
router.get('/campaigns', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const snapshot = await firestore.collection('treasure_campaigns')
      .orderBy('createdAt', 'desc')
      .get();
    
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/treasure/campaigns/active - Get active public campaigns
router.get('/campaigns/active', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await firestore.collection('treasure_campaigns')
      .where('status', '==', 'active')
      .where('isPublic', '==', true)
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .get();
    
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching active campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/treasure/campaigns/:id - Get single campaign
router.get('/campaigns/:id', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const doc = await firestore.collection('treasure_campaigns').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/treasure/campaigns - Create campaign
router.post('/campaigns', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      rewardType, 
      rewardValue,
      isPublic,
      maxParticipants 
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const campaignData = {
      name,
      description: description || { fr: '', 'ar-tn': '' },
      status: 'draft',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rewardType: rewardType || 'coupon',
      rewardValue: rewardValue || {},
      isPublic: isPublic || false,
      maxParticipants: maxParticipants || 0,
      currentParticipants: 0,
      metrics: {
        totalScans: 0,
        uniqueParticipants: 0,
        treasuresFound: 0,
        rewardsClaimed: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('treasure_campaigns').add(campaignData);
    
    res.status(201).json({ 
      success: true, 
      campaignId: docRef.id,
      message: 'Campaign created successfully' 
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/treasure/campaigns/:id - Update campaign
router.put('/campaigns/:id', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.metrics;
    delete updateData.createdAt;

    await firestore.collection('treasure_campaigns').doc(req.params.id).update(updateData);
    
    res.json({ success: true, message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/treasure/campaigns/:id - Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    await firestore.collection('treasure_campaigns').doc(req.params.id).delete();
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST /api/treasure/campaigns/:id/publish - Publish campaign
router.post('/campaigns/:id/publish', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    await firestore.collection('treasure_campaigns').doc(req.params.id).update({
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'Campaign published successfully' });
  } catch (error) {
    console.error('Error publishing campaign:', error);
    res.status(500).json({ error: 'Failed to publish campaign' });
  }
});

// ============================================
// LOCATION ROUTES
// ============================================

// GET /api/treasure/campaigns/:campaignId/locations - Get locations for campaign
router.get('/campaigns/:campaignId/locations', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const snapshot = await firestore.collection('treasure_locations')
      .where('campaignId', '==', req.params.campaignId)
      .orderBy('order', 'asc')
      .get();
    
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /api/treasure/campaigns/:campaignId/locations - Add location
router.post('/campaigns/:campaignId/locations', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const { 
      name, 
      description, 
      hint,
      latitude, 
      longitude,
      rewardType,
      rewardValue,
      order
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique QR code
    const qrCode = `TAMA-${req.params.campaignId}-LOC-${Date.now()}`;

    const locationData = {
      campaignId: req.params.campaignId,
      name: name || { fr: '', 'ar-tn': '' },
      description: description || { fr: '', 'ar-tn': '' },
      hint: hint || { fr: '', 'ar-tn': '' },
      coordinates: {
        latitude,
        longitude
      },
      qrCode,
      rewardType: rewardType || 'coupon',
      rewardValue: rewardValue || {},
      order: order || 0,
      isActive: true,
      isDiscoverable: true,
      timesDiscovered: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('treasure_locations').add(locationData);
    
    res.status(201).json({ 
      success: true, 
      locationId: docRef.id,
      qrCode,
      message: 'Location added successfully' 
    });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ error: 'Failed to add location' });
  }
});

// ============================================
// USER/ENROLLMENT ROUTES
// ============================================

// POST /api/treasure/enroll - Enroll user in campaign
router.post('/enroll', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const { campaignId, userId } = req.body;

    if (!campaignId || !userId) {
      return res.status(400).json({ error: 'Missing campaignId or userId' });
    }

    // Check if already enrolled
    const existingQuery = await firestore.collection('treasure_participations')
      .where('campaignId', '==', campaignId)
      .where('userId', '==', userId)
      .get();

    if (!existingQuery.empty) {
      return res.status(400).json({ error: 'Already enrolled in this campaign' });
    }

    // Get campaign locations
    const locationsSnapshot = await firestore.collection('treasure_locations')
      .where('campaignId', '==', campaignId)
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get();

    const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const firstLocation = locations[0];

    // Create participation
    const participationData = {
      campaignId,
      userId,
      status: 'in_progress',
      progress: {
        totalLocations: locations.length,
        discoveredLocations: 0,
        discoveredLocationIds: [],
        currentLocationId: firstLocation?.id || null
      },
      claimedRewards: [],
      finalReward: null,
      metrics: {
        timeSpentMinutes: 0,
        hintsUsed: 0,
        socialShares: 0
      },
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('treasure_participations').add(participationData);

    // Update campaign participant count
    await firestore.collection('treasure_campaigns').doc(campaignId).update({
      currentParticipants: admin.firestore.FieldValue.increment(1),
      'metrics.uniqueParticipants': admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ 
      success: true, 
      participationId: docRef.id,
      currentLocation: firstLocation,
      message: 'Enrolled successfully' 
    });
  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

// GET /api/treasure/participations/:userId - Get user's participations
router.get('/participations/:userId', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const snapshot = await firestore.collection('treasure_participations')
      .where('userId', '==', req.params.userId)
      .orderBy('enrolledAt', 'desc')
      .get();
    
    const participations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ participations });
  } catch (error) {
    console.error('Error fetching participations:', error);
    res.status(500).json({ error: 'Failed to fetch participations' });
  }
});

// ============================================
// SCAN/DISCOVERY ROUTES
// ============================================

// POST /api/treasure/scan - Process QR scan
router.post('/scan', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const { 
      qrCode, 
      userId, 
      userLatitude, 
      userLongitude,
      campaignId,
      locationId 
    } = req.body;

    if (!qrCode || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find location by QR code or ID
    let locationQuery;
    if (locationId) {
      locationQuery = await firestore.collection('treasure_locations').doc(locationId).get();
    } else if (qrCode) {
      const querySnapshot = await firestore.collection('treasure_locations')
        .where('qrCode', '==', qrCode)
        .limit(1)
        .get();
      if (!querySnapshot.empty) {
        locationQuery = querySnapshot.docs[0];
      }
    }

    if (!locationQuery || !locationQuery.exists) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const location = { id: locationQuery.id, ...locationQuery.data() };

    // Get user's participation
    const participationQuery = await firestore.collection('treasure_participations')
      .where('campaignId', '==', location.campaignId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (participationQuery.empty) {
      return res.status(400).json({ error: 'Not enrolled in this campaign' });
    }

    const participation = { id: participationQuery.docs[0].id, ...participationQuery.docs[0].data() };
    const isAlreadyDiscovered = participation.progress.discoveredLocationIds.includes(location.id);

    // Calculate distance (simplified)
    let isWithinRadius = true;
    if (userLatitude && userLongitude && location.coordinates) {
      const distance = calculateDistance(
        userLatitude, userLongitude,
        location.coordinates.latitude, location.coordinates.longitude
      );
      isWithinRadius = distance <= (location.radius || 50); // Default 50 meters
    }

    // Log scan
    const scanData = {
      campaignId: location.campaignId,
      locationId: location.id,
      userId,
      scanData: {
        qrCode,
        timestamp: admin.firestore.Timestamp.now(),
        userLocation: userLatitude && userLongitude ? { latitude: userLatitude, longitude: userLongitude } : null
      },
      validation: {
        isValid: isWithinRadius && !isAlreadyDiscovered,
        isWithinRadius,
        isAlreadyDiscovered
      }
    };

    await firestore.collection('treasure_scans').add(scanData);

    // Update metrics
    await firestore.collection('treasure_campaigns').doc(location.campaignId).update({
      'metrics.totalScans': admin.firestore.FieldValue.increment(1)
    });

    if (isAlreadyDiscovered) {
      return res.json({
        success: false,
        message: 'Already discovered this location',
        isAlreadyDiscovered: true
      });
    }

    if (!isWithinRadius) {
      return res.json({
        success: false,
        message: 'You are not close enough to this treasure',
        isWithinRadius: false
      });
    }

    // Success - update participation
    const newDiscoveredIds = [...participation.progress.discoveredLocationIds, location.id];
    const nextOrder = (location.order || 0) + 1;
    
    // Find next location
    const nextLocationQuery = await firestore.collection('treasure_locations')
      .where('campaignId', '==', location.campaignId)
      .where('order', '==', nextOrder)
      .limit(1)
      .get();

    const nextLocation = nextLocationQuery.empty ? null : { id: nextLocationQuery.docs[0].id, ...nextLocationQuery.docs[0].data() };

    await firestore.collection('treasure_participations').doc(participation.id).update({
      'progress.discoveredLocationIds': newDiscoveredIds,
      'progress.discoveredLocations': newDiscoveredIds.length,
      'progress.currentLocationId': nextLocation?.id || null,
      'progress.discoveredAt': [...(participation.progress.discoveredAt || []), admin.firestore.Timestamp.now()],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check if completed
    const isCompleted = newDiscoveredIds.length >= participation.progress.totalLocations;

    // Update campaign metrics
    await firestore.collection('treasure_campaigns').doc(location.campaignId).update({
      'metrics.treasuresFound': admin.firestore.FieldValue.increment(1)
    });

    res.json({
      success: true,
      isNewDiscovery: true,
      location: {
        id: location.id,
        name: location.name,
        description: location.description,
        hint: location.hint,
        rewardType: location.rewardType,
        rewardValue: location.rewardValue
      },
      nextLocation: nextLocation ? {
        id: nextLocation.id,
        hint: nextLocation.hint
      } : null,
      progress: {
        discovered: newDiscoveredIds.length,
        total: participation.progress.totalLocations
      },
      isCompleted
    });

  } catch (error) {
    console.error('Error processing scan:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});

// GET /api/treasure/map/:campaignId - Get map data for campaign
router.get('/map/:campaignId', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const { userId } = req.query;
    const campaignId = req.params.campaignId;

    // Get locations
    const locationsSnapshot = await firestore.collection('treasure_locations')
      .where('campaignId', '==', campaignId)
      .where('isActive', '==', true)
      .get();

    let locations = locationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        coordinates: data.coordinates,
        isDiscoverable: data.isDiscoverable,
        order: data.order
      };
    });

    // If user is enrolled, filter based on progress
    if (userId) {
      const participationQuery = await firestore.collection('treasure_participations')
        .where('campaignId', '==', campaignId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!participationQuery.empty) {
        const participation = participationQuery.docs[0].data();
        const discoveredIds = participation.progress.discoveredLocationIds;
        
        // Show all locations but mark discovered ones
        locations = locations.map(loc => ({
          ...loc,
          isDiscovered: discoveredIds.includes(loc.id),
          isCurrentTarget: loc.id === participation.progress.currentLocationId
        }));
      }
    }

    res.json({ locations });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// GET /api/treasure/analytics/dashboard - Admin dashboard
router.get('/analytics/dashboard', async (req, res) => {
  const firestore = getDb();
  if (!firestore) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    // Get campaign counts
    const campaignsSnapshot = await firestore.collection('treasure_campaigns').get();
    const totalCampaigns = campaignsSnapshot.size;
    
    const activeCampaigns = campaignsSnapshot.docs.filter(d => d.data().status === 'active').length;

    // Get participation count
    const participationsSnapshot = await firestore.collection('treasure_participations').get();
    const totalParticipants = participationsSnapshot.size;

    // Get total scans
    const scansSnapshot = await firestore.collection('treasure_scans').get();
    const totalScans = scansSnapshot.size;

    // Get unique users who scanned
    const uniqueUsers = new Set(scansSnapshot.docs.map(d => d.data().userId)).size;

    res.json({
      totalCampaigns,
      activeCampaigns,
      totalParticipants,
      totalScans,
      uniqueUsers
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

module.exports = router;

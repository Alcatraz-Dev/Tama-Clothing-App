import { db, rtdb } from '../api/firebase';
import { sendPushNotification } from './notifications';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    getDoc,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';

export type ShipmentStatus = 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Shipment {
    id: string;
    trackingId: string;
    senderId: string;
    senderName: string;
    receiverName: string;
    receiverPhone: string;
    deliveryAddress: string;
    status: ShipmentStatus;
    items: any[];
    weight: string;
    serviceType: string;
    carrierName: string;
    carrierPhone: string;
    stickerUrl?: string;
    driverId?: string;
    createdAt: any;
    updatedAt: any;
    currentLocation?: {
        latitude: number;
        longitude: number;
        timestamp: number;
    };
    route?: { latitude: number; longitude: number; timestamp: number }[];
    proofOfDeliveryUrl?: string;
    rating?: number;
    ratingComment?: string;
}

export const generateTrackingId = () => {
    const chars = '0123456789';
    let result = 'TAMA-';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'trackingId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const trackingId = generateTrackingId();
    
    // 1. Create in Firestore for permanent record
    const docRef = await addDoc(collection(db, 'Shipments'), {
        ...shipmentData,
        trackingId,
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // 2. Initialize in Realtime Database for live tracking
    const rtdbRef = ref(rtdb, `tracking/${trackingId}`);
    await set(rtdbRef, {
        status: 'Pending',
        updatedAt: Date.now(),
        location: null,
        driverId: null
    });

    return { id: docRef.id, trackingId };
};

export const generateShippingStickerHTML = (shipment: Partial<Shipment>) => {
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${shipment.trackingId}&scale=2&rotate=N&includetext=true`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shipment.trackingId}`;

    return `
    <html>
      <head>
        <style>
          @page { margin: 0; size: 4in 6in; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            width: 4in; 
            height: 6in; 
            box-sizing: border-box;
            background: #fff;
            color: #000;
          }
          .label-container {
            border: 2px solid #000;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding: 8px 12px;
          }
          .header-left {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header-right {
            font-size: 10px;
            font-weight: 600;
          }
          .address-section {
            padding: 12px;
            border-bottom: 2px solid #000;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .sender {
            font-size: 10px;
            color: #333;
            margin-bottom: 20px;
          }
          .sender strong { font-size: 11px; color: #000; }
          
          .recipient-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .recipient {
            font-size: 15px;
            line-height: 1.4;
          }
          .recipient strong { 
            font-size: 18px; 
            display: block; 
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .qr-code {
            width: 80px;
            height: 80px;
            border: 2px solid #000;
            padding: 2px;
          }
          
          .items-section {
            padding: 8px 12px;
            border-bottom: 2px solid #000;
            font-size: 10px;
            flex-grow: 0.5;
            background: #f9f9f9;
          }
          .items-title {
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 4px;
            font-size: 9px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2px;
          }
          .items-list {
            margin: 0; padding: 0; list-style: none;
            max-height: 45px;
            overflow: hidden;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 10px;
            font-weight: 600;
          }

          .tracking-section {
            text-align: center;
            padding: 15px 12px;
          }
          .tracking-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .barcode {
            max-width: 90%;
            height: 60px;
          }
          .tracking-number {
            font-size: 14px;
            font-weight: 800;
            margin-top: 8px;
            letter-spacing: 1px;
          }
          .footer {
            border-top: 2px solid #000;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            background: #000;
            color: #fff;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <!-- Header -->
          <div class="header">
            <div class="header-left">TAMA CLOTHING HUB</div>
            <div class="header-right">${shipment.serviceType || 'STANDARD TND'}</div>
          </div>

          <!-- Addresses & QR -->
          <div class="address-section">
            <div class="sender">
              <strong>FROM: ${shipment.senderName || 'TAMA LOGISTICS'}</strong><br/>
              Tama Fulfillment Center<br/>
              Tunis, Tunisia 1000<br/>
              ${shipment.carrierPhone || '+216 71 000 000'}
            </div>
            
            <div class="recipient-container">
              <div class="recipient">
                <strong>TO: ${shipment.receiverName || 'CUSTOMER'}</strong>
                ${(shipment.deliveryAddress || '').replace(/,/g, '<br/>')}<br/>
                Phone: ${shipment.receiverPhone || 'N/A'}
              </div>
              <img src="${qrUrl}" class="qr-code" />
            </div>
          </div>

          <!-- Items Overview -->
          <div class="items-section">
            <div class="items-title">PACKAGE CONTENTS (WEIGHT: ${shipment.weight || '1.0KG'})</div>
            <ul class="items-list">
              ${(shipment.items || []).slice(0, 3).map((item: any) => `
                <li class="item-row">
                  <span>${typeof item === 'string' ? item : item.name}</span>
                  <span>Qty: ${item.quantity || 1}</span>
                </li>
              `).join('')}
              ${(shipment.items && shipment.items.length > 3) ? '<li class="item-row"><i>+ more items</i></li>' : ''}
            </ul>
          </div>

          <!-- Tracking & Barcode -->
          <div class="tracking-section">
            <div class="tracking-title">USPS TRACKING #</div>
            <img src="${barcodeUrl}" class="barcode" />
            <div class="tracking-number">${shipment.trackingId || 'N/A'}</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>${shipment.carrierName || 'TAMA LOGISTICS'}</div>
            <div>DATE: ${new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>
      </body>
    </html>
    `;
};

export const updateShipmentStatus = async (shipmentId: string, trackingId: string, status: ShipmentStatus, extraData: any = {}) => {
    // 1. Update Firestore
    const docRef = doc(db, 'Shipments', shipmentId);
    await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
        ...extraData
    });

    // 2. Update RTDB
    const rtdbRef = ref(rtdb, `tracking/${trackingId}`);
    await set(rtdbRef, {
        status,
        updatedAt: Date.now(),
        ...extraData
    });

    // 3. Send Push Notification to Customer
    try {
        const shipmentSnap = await getDoc(docRef);
        if (shipmentSnap.exists()) {
            const shipmentData = shipmentSnap.data();
            const senderId = shipmentData.senderId;
            
            if (senderId && senderId !== 'anonymous') {
                const userSnap = await getDoc(doc(db, 'users', senderId));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const token = userData.pushToken || userData.expoPushToken;
                    
                    if (token) {
                        const statusMessages: any = {
                            'In Transit': 'Votre colis est en transit ! 🚚',
                            'Out for Delivery': 'Votre colis est en cours de livraison ! 📦',
                            'Delivered': 'Votre colis a été livré ! ✅',
                            'Cancelled': 'Votre commande a été annulée. ❌'
                        };
                        
                        await sendPushNotification(
                            token,
                            `Suivi de Livraison: ${trackingId}`,
                            statusMessages[status] || `Le statut de votre colis est maintenant: ${status}`,
                            { trackingId, screen: 'ShipmentTracking' }
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error('Failed to send status notification', e);
    }
};

export const updateShipmentLocation = async (trackingId: string, location: { latitude: number; longitude: number }, shipmentId?: string) => {
    const timestamp = Date.now();
    const locationData = { ...location, timestamp };

    // 1. Update RTDB for live tracking
    const rtdbRef = ref(rtdb, `tracking/${trackingId}/location`);
    await set(rtdbRef, locationData);

    // 2. record route in Firestore (Optional: throttled)
    if (shipmentId) {
        const docRef = doc(db, 'Shipments', shipmentId);
        // We can use arrayUnion to add to the route, but maybe just occasionally
        // or keep current location in Firestore too
        await updateDoc(docRef, {
            currentLocation: locationData,
            updatedAt: serverTimestamp()
        });
    }
};

export const calculateETA = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Haversine formula to get distance in km
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Assume average city speed 30km/h
    const timeInHours = distance / 30;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 5) return "Moins de 5 min";
    return `Environ ${timeInMinutes} min`;
};

export const subscribeToTracking = (trackingId: string, onUpdate: (data: any) => void) => {
    const rtdbRef = ref(rtdb, `tracking/${trackingId}`);
    onValue(rtdbRef, (snapshot) => {
        onUpdate(snapshot.val());
    });
    return () => off(rtdbRef);
};

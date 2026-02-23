import { Image } from 'react-native';
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
    shippingPrice?: number;
    totalPrice?: number;
    senderAddress?: string;
    senderPhone?: string;
    brandLogoUrl?: string;
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
  const safe = (v: any) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const trackingId = safe(shipment.trackingId || "N/A");

  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    trackingId
  )}&scale=2&rotate=N&includetext=true`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    trackingId
  )}`;

  const logoUri = shipment.brandLogoUrl || Image.resolveAssetSource(
    require("../../assets/logo.png")
  ).uri;

  const formatWeight = (w?: number | string) =>
    typeof w === "number" ? `${w.toFixed(2)} KG` : safe(w || "1.00 KG");

  const formatPrice = (p?: number) =>
    typeof p === "number" ? `${p.toFixed(2)} TND` : "";

  const itemsHtml = (shipment.items || [])
    .slice(0, 5)
    .map((item: any) => {
      const name = safe(typeof item === "string" ? item : item?.name || "Article");
      const qty = Number(item?.quantity || 1);
      const size = item?.size ? `Taille: ${safe(item.size)}` : "";
      const color = item?.color ? `Couleur: ${safe(item.color)}` : "";
      const attrs = [size, color].filter(Boolean).join(" | ");
      const price = formatPrice(item?.price);

      return `
        <li class="item-row">
          <div class="item-left">
            <div class="item-name">${name}</div>
            ${attrs ? `<div class="item-attrs">${attrs}</div>` : ""}
          </div>
          <div class="item-right">
            <div>Qté : ${qty}</div>
            ${price ? `<div class="item-price">${price}</div>` : ""}
          </div>
        </li>
      `;
    })
    .join("");

  const hasMore =
    shipment.items && shipment.items.length > 5
      ? `<li class="item-more">+ d'articles...</li>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
@page { margin: 0; size: 4in 6in; }

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 10px;
  width: 4in;
  height: 6in;
  box-sizing: border-box;
  background: #fff;
  color: #000;
  display: flex;
  flex-direction: column;
}

.label {
  position: relative;
  border: 2px solid #000;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Tracking & Bottom Section */
.tracking-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding: 0 10px;
}

.tracking-qr {
  width: 60px;
  height: 60px;
  border: 2px solid #000;
  border-radius: 10px;
  padding: 4px;
  box-sizing: border-box;
}

.tracking-qr img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.tracking-logo {
  width: 54px;
  height: 54px;
  background: #000;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tracking-logo img {
  width: 60%;
  height: 60%;
  object-fit: contain;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding: 8px 10px;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 11px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-logo {
  width: 38px;
  height: 38px;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

.header-logo img {
  width: 65%;
  height: 65%;
  object-fit: contain;
}

.section {
  border-bottom: 2px solid #000;
  padding: 8px;
}

.sender {
  font-size: 11px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.recipient-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.recipient {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.recipient-name {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 4px;
}

.qr-box {
  width: 90px;
  height: 90px;
  border: 2px solid #000;
  border-radius: 18px;
  padding: 6px;
  box-sizing: border-box;
}

.qr-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.items {
  background: #f5f5f5;
  font-size: 10px;
}

.items-title {
  font-weight: 900;
  border-bottom: 2px solid #000;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.items ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #ccc;
  padding: 4px 0;
}

.item-name {
  font-weight: 800;
  font-size: 11px;
}

.item-attrs {
  font-size: 9px;
  color: #444;
}

.item-right {
  text-align: right;
  white-space: nowrap;
}

.item-price {
  font-weight: 900;
}

.item-more {
  text-align: center;
  color: #555;
  padding-top: 4px;
}

.tracking {
  text-align: center;
  padding: 8px;
}

.tracking-title {
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.tracking-number {
  font-family: monospace;
  font-size: 16px;
  font-weight: 900;
  flex: 1;
  text-align: center;
}
.summary-section {
  padding: 8px 10px;
  border-bottom: 2px solid #000;
  font-size: 11px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.total-row {
  font-weight: 900;
  font-size: 14px;
  margin-top: 6px;
  border-top: 2px dashed #000;
  padding-top: 6px;
}
.footer {
  margin-top: auto;
  padding: 8px 10px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
  background: #000;
  color: #fff;
}
</style>
</head>

<body>
  <div class="label">

    <div class="header">
      <div class="header-left">
        <div class="header-logo">
          <img src="${logoUri}" />
        </div>
        <div>${safe(shipment.senderName || "TAMA LOGISTICS")}</div>
      </div>
      <div>${safe(shipment.serviceType || "STANDARD TND")}</div>
    </div>

    <div class="section">
      <div class="sender">
        <strong>EXPÉDITEUR :</strong><br/>
        ${safe(shipment.senderName || "TAMA LOGISTICS")}<br/>
        ${(shipment.senderAddress || "Tunis, Tunisie 1000").split(",").map(l => safe(l.trim())).join("<br/>")}<br/>
        Tél: ${safe(shipment.senderPhone || shipment.carrierPhone || "+216 71 000 000")}
      </div>

      <div class="recipient-container">
        <div class="recipient">
          <div><strong>DESTINATAIRE :</strong></div>
          <div class="recipient-name">${safe(shipment.receiverName || "CLIENT")}</div>
          ${(shipment.deliveryAddress || "")
            .split(",")
            .map((l) => safe(l.trim()))
            .join("<br/>")}
          <br/>
          Tél: ${safe(shipment.receiverPhone || "N/A")}
        </div>

        <div class="qr-box">
          <img src="${qrUrl}" />
        </div>

      </div>
    </div>

    <div class="section items">
      <div class="items-title">
        CONTENU DU COLIS (POIDS : ${formatWeight(shipment.weight)})
      </div>
      <ul>
        ${itemsHtml}
        ${hasMore}
      </ul>
    </div>

    ${typeof shipment.totalPrice === 'number' ? `
    <div class="summary-section">
      <div class="summary-row">
        <div>Frais de livraison</div>
        <div>${typeof shipment.shippingPrice === 'number' ? shipment.shippingPrice.toFixed(2) + ' TND' : 'Inclus'}</div>
      </div>
      <div class="summary-row total-row">
        <div>TOTAL À PAYER</div>
        <div>${shipment.totalPrice.toFixed(2)} TND</div>
      </div>
    </div>
    ` : ''}

    <div class="tracking">
      <div class="tracking-title">
        N° DE SUIVI ${safe(shipment.carrierName || "TAMA")}
      </div>
      <div class="tracking-content">
        <div class="tracking-qr">
          <img src="${qrUrl}" />
        </div>
        <div class="tracking-number">${trackingId}</div>
        <div class="tracking-logo">
          <img src="${logoUri}" />
        </div>
      </div>
    </div>

    <div class="footer">
      <div>${safe(shipment.carrierName || "TAMA LOGISTICS")}</div>
      <div>${new Date().toLocaleDateString("en-GB")}</div>
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

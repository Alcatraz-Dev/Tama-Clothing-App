import { Shipment } from './shipping';

export const generateShipmentLabel = (shipment: Shipment) => {
    // In a real app, this would generate a PDF or a high-res image
    // For now, we return a structured object that can be rendered in a Modal
    return {
        trackingId: shipment.trackingId,
        receiver: {
            name: shipment.receiverName,
            phone: shipment.receiverPhone,
            address: shipment.deliveryAddress
        },
        items: shipment.items,
        qrValue: `bey3a-tracking://${shipment.trackingId}`,
        createdAt: shipment.createdAt
    };
};

import { VStack, HStack, Text, Spacer, ZStack, Image } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, offset } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type OrderTrackingWidgetProps = {
    orderId?: string;
    statusProgress?: number;
    statusText?: string;
    estimatedDelivery?: string;
    lang?: 'en' | 'fr' | 'ar';
};

// Map-like visual simulation
const MapSimulation = () => {
    'widget';
    // Use SwiftUI components to draw a map-like UI
    return (
        <ZStack modifiers={[
            frame({ maxWidth: 9999, height: 140 }),
            cornerRadius(16),
            background('#1c1c1e') // Dark map style
        ]}>
            {/* Simulation of road/map paths */}
            <VStack modifiers={[frame({ width: 3, height: 9999 }), background('#2c2c2e'), offset({ x: -40 })]}>{null}</VStack>
            <VStack modifiers={[frame({ width: 3, height: 9999 }), background('#2c2c2e'), offset({ x: 20 })]}>{null}</VStack>
            <HStack modifiers={[frame({ width: 9999, height: 3 }), background('#2c2c2e'), offset({ y: 10 })]}>{null}</HStack>

            {/* Path Path */}
            <VStack modifiers={[frame({ width: 4, height: 60 }), background('#0A84FF'), offset({ x: -40, y: 20 }), cornerRadius(2)]}>{null}</VStack>
            <HStack modifiers={[frame({ width: 60, height: 4 }), background('#0A84FF'), offset({ x: -10, y: 50 }), cornerRadius(2)]}>{null}</HStack>

            {/* Pins/Points */}
            <VStack modifiers={[frame({ width: 28, height: 28 }), cornerRadius(14), background('#32D74B'), offset({ x: 20, y: 50 }), frame({ alignment: 'center' })]}>
                <Text modifiers={[font({ size: 14 })]}>🏠</Text>
            </VStack>

            <VStack modifiers={[frame({ width: 28, height: 28 }), cornerRadius(14), background('#FF9F0A'), offset({ x: -40, y: -10 }), frame({ alignment: 'center' })]}>
                <Text modifiers={[font({ size: 14 })]}>🛵</Text>
            </VStack>
            {null}
        </ZStack>
    );
};

const OrderTrackingWidgetComponent = (props: WidgetBase<OrderTrackingWidgetProps>) => {
    'widget';
    const {
        family,
        orderId = 'AMA-38290',
        statusProgress = 0.65,
        statusText = 'En Transit',
        estimatedDelivery = '24 Jan, 14:00',
    } = props;

    const alignment = 'leading';
    const topAlignment = 'topLeading';

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const blueColor = foregroundStyle({ type: 'color', color: '#0A84FF' });

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                📦 {statusText} (#{orderId})
            </Text>
        );
    }

    if (family === 'accessoryRectangular') {
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: alignment })]}>
                <Text modifiers={[font({ size: 20 })]}>📦</Text>
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: alignment })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 14 })]}>#{orderId}</Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{statusText}</Text>
                </VStack>
            </HStack>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ size: 24 })]}>📦</Text>
            </VStack>
        );
    }

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: alignment }), padding({ all: 16 })]}>
                <Text modifiers={[font({ size: 28 })]}>📦</Text>
                <Spacer />
                <VStack modifiers={[frame({ alignment: alignment })]}>
                    <Text modifiers={[font({ weight: 'medium', size: 13 }), secondaryStyle]}>#{orderId}</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 20 }), blueColor]}>{statusText}</Text>
                    <Text modifiers={[font({ size: 11 }), secondaryStyle, padding({ top: 4 })]}>{estimatedDelivery}</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: topAlignment }), padding({ all: 16 })]}>
            <HStack modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999, alignment: alignment })]}>
                <VStack modifiers={[frame({ alignment: alignment })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 20 })]}>Statut Commande</Text>
                    <Text modifiers={[font({ size: 13 }), secondaryStyle]}>#{orderId}</Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 32 }), blueColor]}>🛵</Text>
            </HStack>

            <VStack modifiers={[padding({ bottom: 16 }), frame({ alignment: alignment })]}>
                <Text modifiers={[font({ weight: 'black', size: 26 }), blueColor]}>{statusText}</Text>
                <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Prévu: {estimatedDelivery}</Text>
            </VStack>

            {/* Map Simulation */}
            <MapSimulation />

            {family === 'systemLarge' && (
                <VStack modifiers={[padding({ top: 24, bottom: 0, leading: 0, trailing: 0 }), frame({ alignment: alignment })]}>
                    <HStack modifiers={[frame({ alignment: alignment })]}>
                        <VStack modifiers={[frame({ width: 12, height: 12 }), cornerRadius(6), background('#0A84FF')]}>{null}</VStack>
                        <VStack modifiers={[padding({ leading: 12 }), frame({ alignment: alignment })]}>
                            <Text modifiers={[font({ weight: 'bold', size: 15 })]}>En Transit</Text>
                            <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Le colis est en route</Text>
                        </VStack>
                    </HStack>
                </VStack>
            )}
        </VStack>
    );
};

const OrderTrackingWidget = createWidget('OrderTrackingWidget', OrderTrackingWidgetComponent);
export default OrderTrackingWidget;

OrderTrackingWidget.updateSnapshot({
    orderId: 'BC-20192',
    statusProgress: 0.65,
    statusText: 'In Transit',
    estimatedDelivery: 'Thursday, 3:00 PM'
});

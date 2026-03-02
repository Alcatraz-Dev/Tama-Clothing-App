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
const MapSimulation = (props: { height: number }) => {
    'widget';
    const { height } = props;
    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, height: height }),
            cornerRadius(10),
            background('#1c1c1e')
        ]}>
            <ZStack modifiers={[frame({ maxWidth: 9999, height: height })]}>
                <VStack modifiers={[frame({ width: 2, height: height }), background('#2c2c2e'), offset({ x: -40 })]}><Spacer /></VStack>
                <VStack modifiers={[frame({ width: 2, height: height }), background('#2c2c2e'), offset({ x: 20 })]}><Spacer /></VStack>
                <HStack modifiers={[frame({ width: 9999, height: 2 }), background('#2c2c2e'), offset({ y: 10 })]}><Spacer /></HStack>

                <VStack modifiers={[frame({ width: 24, height: 24 }), cornerRadius(12), background('#32D74B'), offset({ x: 40, y: height / 4 }), frame({ alignment: 'center' })]}>
                    <Text modifiers={[font({ size: 12 })]}>🏠</Text>
                </VStack>

                <VStack modifiers={[frame({ width: 24, height: 24 }), cornerRadius(12), background('#FF9F0A'), offset({ x: -20, y: -height / 4 }), frame({ alignment: 'center' })]}>
                    <Text modifiers={[font({ size: 12 })]}>🛵</Text>
                </VStack>
            </ZStack>
        </VStack>
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
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: alignment }),
                padding({ all: 14 }),
                background('#1C1C1E') // Dark background for consistency
            ]}>
                <Text modifiers={[font({ size: 24 })]}>📦</Text>
                <Spacer />
                <VStack modifiers={[frame({ alignment: alignment })]}>
                    <Text modifiers={[font({ weight: 'medium', size: 12 }), secondaryStyle]}>#{orderId}</Text>
                    <Text modifiers={[font({ weight: 'black', size: 18 }), blueColor]}>{statusText}</Text>
                    <Text modifiers={[font({ size: 10 }), secondaryStyle, padding({ top: 2 })]}>{estimatedDelivery}</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium Widget ────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                padding({ all: 14 }),
                background('#1C1C1E') // Dark background
            ]}>
                <HStack modifiers={[padding({ bottom: 6 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle('#FFFFFF')]}>Suivi Commande</Text>
                        <Text modifiers={[font({ size: 11 }), secondaryStyle]}>#{orderId}</Text>
                    </VStack>
                    <Spacer />
                    <Text modifiers={[font({ size: 20 })]}>🛵</Text>
                </HStack>

                <VStack modifiers={[padding({ bottom: 8 }), frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'black', size: 20 }), blueColor]}>{statusText}</Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>Livraison: {estimatedDelivery}</Text>
                </VStack>

                <MapSimulation height={80} />
            </VStack>
        );
    }

    // ── Large Widget ─────────────────────────────────────────────────────────────
    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            padding({ all: 16 }),
            background('#1C1C1E') // Dark background
        ]}>
            <HStack modifiers={[padding({ bottom: 10 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#FFFFFF')]}>Statut de la Commande</Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>#{orderId}</Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 28 }), blueColor]}>🛵</Text>
            </HStack>

            <VStack modifiers={[padding({ bottom: 12 }), frame({ alignment: 'leading' })]}>
                <Text modifiers={[font({ weight: 'black', size: 24 }), blueColor]}>{statusText}</Text>
                <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Prévu: {estimatedDelivery}</Text>
            </VStack>

            <MapSimulation height={110} />

            {family === 'systemLarge' && (
                <VStack modifiers={[padding({ top: 18 }), frame({ alignment: 'leading' })]}>
                    <HStack modifiers={[frame({ alignment: 'leading' })]}>
                        <VStack modifiers={[frame({ width: 8, height: 8 }), cornerRadius(4), background('#32D74B')]}><Spacer /></VStack>

                        <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                            <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle('#FFFFFF')]}>En cours de livraison</Text>
                            <Text modifiers={[font({ size: 11 }), secondaryStyle]}>Le livreur est proche de votre adresse</Text>
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

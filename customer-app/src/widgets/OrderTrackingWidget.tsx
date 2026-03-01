import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type OrderTrackingWidgetProps = {
    orderId?: string;
    statusProgress?: number;
    statusText?: string;
    estimatedDelivery?: string;
};

const OrderTrackingWidgetComponent = (props: WidgetBase<OrderTrackingWidgetProps>) => {
    'widget';
    const {
        family,
        orderId = 'AMA-38290',
        statusProgress = 0.65,
        statusText = 'In Transit',
        estimatedDelivery = 'Jan 24, 2:00 PM'
    } = props;

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
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 20 })]}>📦</Text>
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
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
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ all: 16 })]}>
                <Text modifiers={[font({ size: 28 })]}>📦</Text>
                <Spacer />
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'medium', size: 13 }), secondaryStyle]}>#{orderId}</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 20 }), blueColor]}>{statusText}</Text>
                    <Text modifiers={[font({ size: 11 }), secondaryStyle, padding({ top: 4 })]}>{estimatedDelivery}</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: 16 })]}>
            <HStack modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 20 })]}>Order Status</Text>
                    <Text modifiers={[font({ size: 13 }), secondaryStyle]}>#{orderId}</Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 32 })]}>🛵</Text>
            </HStack>

            <VStack modifiers={[padding({ top: 12 }), frame({ alignment: 'leading' })]}>
                <Text modifiers={[font({ weight: 'black', size: 26 }), blueColor]}>{statusText}</Text>
                <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Expected: {estimatedDelivery}</Text>
            </VStack>

            {family === 'systemLarge' && (
                <VStack modifiers={[padding({ top: 24 }), frame({ alignment: 'leading' })]}>
                    <HStack modifiers={[frame({ alignment: 'leading' })]}>
                        <VStack modifiers={[frame({ width: 12, height: 12 }), cornerRadius(6), foregroundStyle({ type: 'color', color: '#0A84FF' })]}>{null}</VStack>
                        <VStack modifiers={[padding({ leading: 12 }), frame({ alignment: 'leading' })]}>
                            <Text modifiers={[font({ weight: 'bold', size: 15 })]}>In Transit</Text>
                            <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Package is on the way to your location</Text>
                        </VStack>
                    </HStack>
                    <HStack modifiers={[padding({ top: 16 }), frame({ alignment: 'leading' })]}>
                        <VStack modifiers={[frame({ width: 12, height: 12 }), cornerRadius(6), foregroundStyle({ type: 'color', color: '#2c2c2e' })]}>{null}</VStack>
                        <VStack modifiers={[padding({ leading: 12 }), frame({ alignment: 'leading' })]}>
                            <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}>Arrived at Depot</Text>
                            <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Package scanned at local facility</Text>
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

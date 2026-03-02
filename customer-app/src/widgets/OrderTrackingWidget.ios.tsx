import { VStack, HStack, Text, Spacer, ZStack, Image } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, offset } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type OrderTrackingWidgetProps = {
    orderId?: string;
    statusText?: string;
    estimatedDelivery?: string;
    isDark?: boolean;
};

const OrderTrackingWidgetComponent = (props: WidgetBase<OrderTrackingWidgetProps>) => {
    'widget';
    const {
        family,
        orderId = 'AMA-38290',
        statusText = 'En préparation',
        estimatedDelivery = 'Demain',
        isDark = true
    } = props;

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const blueStyle = foregroundStyle({ type: 'color', color: '#0A84FF' });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }),
                padding({ all: 0 }),
                background(bgColor)
            ]}>
                <VStack modifiers={[
                    frame({ maxWidth: 9999, height: 75, alignment: 'center' }),
                    background(cardBgColor)
                ]}>
                    <Image systemName="truck.box.fill" modifiers={[font({ size: 36 }), blueStyle]} />
                </VStack>

                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 12 }), secondaryStyle]}>SUIVI</Text>
                    <Text modifiers={[font({ weight: 'black', size: 14 }), foregroundStyle(primaryTextColor), padding({ top: 1 })]}>{orderId}</Text>
                    <Text modifiers={[font({ size: 11 }), blueStyle, padding({ top: 1 })]}>{statusText}</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                📦 {orderId}: {statusText}
            </Text>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Image systemName="box.truck.fill" modifiers={[font({ size: 22 }), blueStyle]} />
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    const isLarge = family === 'systemLarge';
    const headerPadding = isLarge ? 16 : 12;

    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            padding({ all: 0 }),
            background(bgColor)
        ]}>
            <VStack modifiers={[
                frame({ maxWidth: 9999 }),
                padding({ horizontal: headerPadding, vertical: isLarge ? 12 : 8 }),
                background(cardBgColor)
            ]}>
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'black', size: isLarge ? 20 : 16 }), foregroundStyle(primaryTextColor)]}>Suivi Commande</Text>
                        <Text modifiers={[font({ size: 11 }), secondaryStyle]}>ID: {orderId}</Text>
                    </VStack>
                    <Spacer />
                    <Image systemName="box.truck.fill" modifiers={[font({ size: isLarge ? 24 : 18 }), blueStyle]} />
                </HStack>
            </VStack>

            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ all: headerPadding })]}>
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ bottom: isLarge ? 16 : 12 })]}>
                    <VStack modifiers={[
                        frame({ width: isLarge ? 48 : 40, height: isLarge ? 48 : 40, alignment: 'center' }),
                        cornerRadius(10),
                        background(isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(10, 132, 255, 0.1)')
                    ]}>
                        <Image systemName="shippingbox.fill" modifiers={[font({ size: isLarge ? 24 : 18 }), blueStyle]} />
                    </VStack>
                    <VStack modifiers={[padding({ leading: isLarge ? 12 : 10 }), frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'bold', size: isLarge ? 16 : 14 }), foregroundStyle(primaryTextColor)]}>{statusText}</Text>
                        <Text modifiers={[font({ size: isLarge ? 13 : 11 }), secondaryStyle]}>Livraison prévue: {estimatedDelivery}</Text>
                    </VStack>
                </HStack>

                {isLarge && (
                    <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ top: 8 })]}>
                        <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(primaryTextColor), padding({ bottom: 12 })]}>Étapes de livraison</Text>
                        {[
                            { t: 'Commande confirmée', d: 'Hier, 14:30', c: true },
                            { t: 'En préparation', d: 'Aujourd\'hui, 09:15', c: true },
                            { t: 'En transit', d: 'À venir', c: false },
                            { t: 'Livré', d: 'À venir', c: false }
                        ].map((step, i) => (
                            <HStack key={i} modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                <VStack modifiers={[
                                    frame({ width: 20, height: 20, alignment: 'center' }),
                                    cornerRadius(10),
                                    background(step.c ? '#34C759' : '#C7C7CC')
                                ]}>
                                    <Image systemName={step.c ? "checkmark" : "circle"} modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle('#FFFFFF')]} />
                                </VStack>
                                <VStack modifiers={[padding({ leading: 10 }), frame({ alignment: 'leading' })]}>
                                    <Text modifiers={[font({ weight: step.c ? 'semibold' : 'regular', size: 13 }), foregroundStyle(step.c ? primaryTextColor : secondaryTextColor)]}>{step.t}</Text>
                                    <Text modifiers={[font({ size: 11 }), secondaryStyle]}>{step.d}</Text>
                                </VStack>
                            </HStack>
                        ))}
                    </VStack>
                )}

                {!isLarge && (
                    <VStack modifiers={[
                        frame({ maxWidth: 9999, height: 4, alignment: 'leading' }),
                        cornerRadius(2),
                        background(isDark ? '#3a3a3c' : '#e5e5ea'),
                        padding({ top: 4 })
                    ]}>
                        <VStack modifiers={[
                            frame({ width: 120, height: 4 }), // Simulated progress
                            cornerRadius(2),
                            background('#34C759')
                        ]}>
                            <Spacer />
                        </VStack>
                    </VStack>
                )}
            </VStack>
        </VStack>
    );
};

const OrderTrackingWidget = createWidget('OrderTrackingWidget', OrderTrackingWidgetComponent);
export default OrderTrackingWidget;

OrderTrackingWidget.updateSnapshot({
    orderId: 'AMA-38290',
    statusText: 'En préparation',
    estimatedDelivery: 'Demain',
    isDark: true
});

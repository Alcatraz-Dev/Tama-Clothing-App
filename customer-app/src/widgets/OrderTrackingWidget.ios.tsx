import { VStack, HStack, Text, Spacer, Image, ProgressView, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow, opacity } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetBase } from 'expo-widgets';

const BEY3A_ACCENT = '#0A84FF'; // Royal Blue for tracking
const RemoteImage = Image as any;

// Map status text to SF Symbols
const getStatusIcon = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('livré') || s.includes('delivered')) return 'checkmark.seal.fill';
    if (s.includes('livraison') || s.includes('out_for_delivery')) return 'box.truck.fill';
    if (s.includes('transit')) return 'location.fill';
    if (s.includes('pris') || s.includes('picked')) return 'hand.raised.fill';
    return 'bag.fill';
};

const OrderTrackingWidgetView = (props: WidgetBase<any>) => {
    'widget';
    const {
        family,
        orderId = 'BEY3A-0000',
        statusText = 'Suivi de commande',
        progress = 0.2,
        estimatedDelivery = 'En préparation',
        isDark = true
    } = props || {};

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryColor = isDark ? '#ffffff' : '#1c1c1e';
    const secondaryColor = isDark ? '#8E8E93' : '#636366';
    const secondaryStyle = foregroundStyle(secondaryColor);
    const accentStyle = foregroundStyle(BEY3A_ACCENT);
    const sfIcon = getStatusIcon(statusText);

    // ── Small ─────────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                background(bgColor)
            ]}>
                <VStack modifiers={[
                    frame({ maxWidth: 9999, height: 75, alignment: 'center' }),
                    background(cardBgColor)
                ]}>
                    <VStack modifiers={[
                        frame({ width: 50, height: 50, alignment: 'center' }),
                        cornerRadius(25),
                        background(`${BEY3A_ACCENT}20`)
                    ]}>
                        <Image systemName={sfIcon} modifiers={[font({ size: 24 }), foregroundStyle(BEY3A_ACCENT)]} />
                    </VStack>
                </VStack>

                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 10, weight: 'black' }), secondaryStyle]}>SUIVI BEY3A</Text>
                    <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(primaryColor), padding({ top: 1 })]}>
                        {statusText}
                    </Text>
                    <Text modifiers={[font({ size: 11, weight: 'semibold' }), accentStyle, padding({ top: 2 })]}>
                        {estimatedDelivery}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium ────────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                background(bgColor)
            ]}>
                <HStack modifiers={[
                    padding({ horizontal: 14, vertical: 12 }),
                    frame({ maxWidth: 9999 }),
                    background(cardBgColor)
                ]}>
                    <VStack alignment="leading">
                        <Text modifiers={[font({ size: 14, weight: 'black' }), secondaryStyle]}>COMMANDE {orderId}</Text>
                        <Text modifiers={[font({ size: 20, weight: 'black' }), foregroundStyle(primaryColor)]}>{statusText}</Text>
                    </VStack>
                    <Spacer />
                    <VStack modifiers={[
                        frame({ width: 44, height: 44, alignment: 'center' }),
                        cornerRadius(10),
                        background(`${BEY3A_ACCENT}15`)
                    ]}>
                        <Image systemName={sfIcon} modifiers={[font({ size: 22 }), foregroundStyle(BEY3A_ACCENT)]} />
                    </VStack>
                </HStack>

                <VStack modifiers={[padding({ horizontal: 14, vertical: 12 }), frame({ maxWidth: 9999 })]}>
                    <HStack modifiers={[padding({ bottom: 6 })]}>
                        <Text modifiers={[font({ size: 12, weight: 'bold' }), secondaryStyle]}>Progression</Text>
                        <Spacer />
                        <Text modifiers={[font({ size: 12, weight: 'bold' }), accentStyle]}>{estimatedDelivery}</Text>
                    </HStack>

                    <ProgressView value={progress} modifiers={[foregroundStyle(BEY3A_ACCENT)]} />

                    <HStack modifiers={[padding({ top: 10 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                        <Image systemName="mappin.and.ellipse" modifiers={[font({ size: 12 }), foregroundStyle(BEY3A_ACCENT)]} />
                        <Text modifiers={[font({ size: 11, weight: 'medium' }), secondaryStyle, padding({ leading: 4 })]}>
                            Mise à jour via Bey3a Express
                        </Text>
                    </HStack>
                </VStack>
            </VStack>
        );
    }

    // ── Large ─────────────────────────────────────────────────────────────────
    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            background(bgColor)
        ]}>
            <HStack modifiers={[
                padding({ horizontal: 16, vertical: 14 }),
                frame({ maxWidth: 9999 }),
                background(cardBgColor)
            ]}>
                <VStack alignment="leading">
                    <Text modifiers={[font({ size: 12, weight: 'black' }), secondaryStyle]}>SUIVI BEY3A</Text>
                    <Text modifiers={[font({ size: 22, weight: 'black' }), foregroundStyle(primaryColor)]}>
                        {statusText}
                    </Text>
                </VStack>
                <Spacer />
                <Image systemName={sfIcon} modifiers={[font({ size: 30 }), foregroundStyle(BEY3A_ACCENT)]} />
            </HStack>

            <VStack modifiers={[padding({ horizontal: 16, vertical: 16 }), frame({ maxWidth: 9999 })]}>
                <VStack alignment="leading" modifiers={[padding({ bottom: 12 })]}>
                    <Text modifiers={[font({ size: 14, weight: 'bold' }), secondaryStyle]}>Statut</Text>
                    <Text modifiers={[font({ size: 18, weight: 'black' }), accentStyle]}>{estimatedDelivery}</Text>
                </VStack>

                <ProgressView value={progress} modifiers={[foregroundStyle(BEY3A_ACCENT), frame({ height: 8 })]} />

                <VStack alignment="leading" modifiers={[padding({ top: 20 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(primaryColor)]}>
                        Votre colis {orderId} est en cours de traitement.
                    </Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle, padding({ top: 4 })]}>
                        Consultez l'application pour plus de détails sur les étapes de livraison.
                    </Text>
                </VStack>
            </VStack>
        </VStack>
    );
};

export default createWidget('OrderTrackingWidget', OrderTrackingWidgetView);

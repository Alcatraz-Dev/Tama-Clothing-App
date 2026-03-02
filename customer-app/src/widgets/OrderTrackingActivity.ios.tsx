import { VStack, HStack, Text, Spacer, Image, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, offset } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type OrderTrackingActivityProps = {
    orderId: string;
    status: string;
    etaMinutes: number;
    driverName: string;
    lang?: 'en' | 'fr' | 'ar';
};

const OrderTrackingActivityComponent = (props: OrderTrackingActivityProps | undefined) => {
    'widget';

    if (!props) return { banner: <Text>Loading...</Text> };

    const alignment = 'leading'; // Default for French

    const blueColor = foregroundStyle({ type: 'color', color: '#0A84FF' });
    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

    return {
        // ── Lock Screen Banner / Notification ──────────────────────────────────
        banner: (
            <VStack modifiers={[padding({ top: 16, bottom: 16, leading: 16, trailing: 16 }), frame({ maxWidth: 9999, alignment: alignment })]}>
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: alignment })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 18 }), blueColor]}>
                        🛵 {props.status}
                    </Text>
                    <Spacer />
                    <Text modifiers={[font({ weight: 'bold', size: 18 })]}>
                        {props.etaMinutes} min
                    </Text>
                </HStack>
                <Text modifiers={[font({ size: 14 }), secondaryStyle, padding({ top: 4 })]}>
                    Commande #{props.orderId} • {props.driverName}
                </Text>

                {/* Visual Progress Line */}
                <ZStack modifiers={[frame({ maxWidth: 9999, height: 6 }), cornerRadius(3), background('#2c2c2e'), padding({ top: 12 })]}>
                    <HStack modifiers={[frame({ width: 200, height: 6 }), cornerRadius(3), background('#0A84FF'), offset({ x: -60 })]}>
                        {null}
                    </HStack>
                    {null}
                </ZStack>
            </VStack>
        ),

        // ── Dynamic Island: Compact Mode ───────────────────────────────────────
        compactLeading: (
            <HStack modifiers={[padding({ leading: 8, trailing: 0 })]}>
                <Text modifiers={[font({ size: 16 })]}>🛵</Text>
            </HStack>
        ),
        compactTrailing: (
            <HStack modifiers={[padding({ trailing: 8, leading: 0 })]}>
                <Text modifiers={[font({ weight: 'bold', size: 14 }), blueColor]}>
                    {props.etaMinutes}m
                </Text>
            </HStack>
        ),

        // ── Dynamic Island: Minimal Mode ────────────────────────────────────────
        minimal: (
            <Text modifiers={[font({ size: 16 })]}>🛵</Text>
        ),

        // ── Dynamic Island: Expanded Mode ───────────────────────────────────────
        expandedLeading: (
            <VStack modifiers={[padding({ top: 8, bottom: 8, leading: 8, trailing: 8 }), frame({ alignment: 'center' })]}>
                <Text modifiers={[font({ size: 28 })]}>📦</Text>
                <Text modifiers={[font({ size: 10 }), secondaryStyle]}>Commande</Text>
            </VStack>
        ),
        expandedTrailing: (
            <VStack modifiers={[padding({ top: 8, bottom: 8, leading: 8, trailing: 8 }), frame({ alignment: 'center' })]}>
                <Text modifiers={[font({ weight: 'black', size: 24 }), blueColor]}>
                    {props.etaMinutes}
                </Text>
                <Text modifiers={[font({ size: 10 }), secondaryStyle]}>MINS</Text>
            </VStack>
        ),
        expandedBottom: (
            <VStack modifiers={[padding({ leading: 16, trailing: 16, bottom: 12, top: 0 }), frame({ maxWidth: 9999, alignment: alignment })]}>
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: alignment })]}>
                    <VStack modifiers={[frame({ alignment: alignment })]}>
                        <Text modifiers={[font({ weight: 'bold', size: 16 })]}>{props.status}</Text>
                        <Text modifiers={[font({ size: 12 }), secondaryStyle]}>Livreur: {props.driverName}</Text>
                    </VStack>
                    <Spacer />
                    {/* Tiny Map Simulation In Expanded View */}
                    <ZStack modifiers={[
                        frame({ width: 80, height: 40 }),
                        cornerRadius(8),
                        background('#1c1c1e')
                    ]}>
                        <HStack modifiers={[frame({ width: 40, height: 2 }), background('#2c2c2e'), offset({ y: -5 })]}>{null}</HStack>
                        <VStack modifiers={[frame({ width: 2, height: 30 }), background('#2c2c2e'), offset({ x: 10 })]}>{null}</VStack>
                        <Text modifiers={[font({ size: 8 }), offset({ x: -15, y: -8 })]}>🛵</Text>
                        <Text modifiers={[font({ size: 8 }), offset({ x: 20, y: 10 })]}>🏠</Text>
                        {null}
                    </ZStack>
                </HStack>
            </VStack>
        ),
    };
};

const OrderTrackingActivity = createLiveActivity('OrderTrackingActivity', OrderTrackingActivityComponent);
export default OrderTrackingActivity;

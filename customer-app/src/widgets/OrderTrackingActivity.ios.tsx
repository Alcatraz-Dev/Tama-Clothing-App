import { Image, Text, VStack, HStack, ProgressView, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

type DeliveryActivityProps = {
    etaMinutes: number;
    status: string;
    progress: number;
    orderId: string;
    driverName: string;
};

// ─── Per-status icon & color ──────────────────────────────────────────
const DeliveryActivity = (props: DeliveryActivityProps | undefined) => {
    'widget';
    const data = props || {
        orderId: 'ID#000',
        status: 'Traitement...',
        progress: 0,
        etaMinutes: 15,
        driverName: 'Bey3a'
    };

    const status = data.status || 'Traitement...';
    const orderId = data.orderId || 'ID#000';
    const progress = data.progress || 0;
    const etaMinutes = data.etaMinutes || 15;

    const getStatusConfig = (s: string) => {
        const val = String(s || '').toLowerCase();
        if (val.includes('livré') || val.includes('delivered')) return { icon: 'checkmark.seal.fill', color: '#34C759' };
        if (val.includes('livraison') || val.includes('out_for_delivery') || val.includes('chemin')) return { icon: 'box.truck.fill', color: '#FF9F0A' };
        if (val.includes('transit')) return { icon: 'location.fill', color: '#0A84FF' };
        if (val.includes('pris') || val.includes('picked')) return { icon: 'hand.raised.fill', color: '#5AC8FA' };
        if (val.includes('annul')) return { icon: 'xmark.circle.fill', color: '#FF453A' };
        return { icon: 'bag.fill', color: '#8A2BE2' };
    };

    const config = getStatusConfig(status);
    const activeIcon = config.icon as any;
    const activeColor = config.color;
    const isDelivered = status.toLowerCase().includes('livré');
    const etaText = etaMinutes <= 0 ? 'Maintenant' : `${etaMinutes}m`;

    return {
        // ── Lock Screen Banner ────────────────────────────────────────────────
        banner: (
            <VStack modifiers={[padding({ all: 16 }), background('#1C1C1E'), frame({ minWidth: 200 })]}>
                <HStack modifiers={[frame({ maxWidth: 9999 })]}>
                    <VStack alignment="leading">
                        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(activeColor)]}>
                            {status}
                        </Text>
                        <Text modifiers={[font({ size: 11 }), foregroundStyle('#8E8E93')]}>
                            COMMANDE {orderId}
                        </Text>
                    </VStack>
                    <Spacer />
                    <VStack modifiers={[frame({ width: 36, height: 36, alignment: 'center' }), background(`${activeColor}33`), cornerRadius(25)]}>
                        <Image systemName={activeIcon} modifiers={[font({ size: 20 }), foregroundStyle(activeColor)]} />
                    </VStack>
                </HStack>
                {!isDelivered && (
                    <VStack modifiers={[padding({ top: 12 }), frame({ maxWidth: 9999 })]}>
                        <HStack modifiers={[padding({ bottom: 4 })]}>
                            <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle('#8E8E93')]}>PRÉVU : {etaText}</Text>
                            <Spacer />
                            <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(activeColor)]}>{Math.round(progress * 100)}%</Text>
                        </HStack>
                        <ProgressView value={progress} modifiers={[foregroundStyle(activeColor)]} />
                    </VStack>
                )}
            </VStack>
        ),

        // ── Compact View ───────────────────────────────────────────────────
        compactLeading: (
            <HStack modifiers={[padding({ leading: 8 }), frame({ width: 36, height: 36, alignment: 'center' }), background(`${activeColor}33`), cornerRadius(25)]}>
                <Image systemName={activeIcon} modifiers={[font({ size: 14 }), foregroundStyle(activeColor)]} />
            </HStack>
        ),

        compactTrailing: (
            <HStack modifiers={[padding({ trailing: 8 })]}>
                <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(activeColor)]}>
                    {isDelivered ? '✓' : etaText}
                </Text>
            </HStack>
        ),

        // ── Minimal ───────────────────────────────────────────────────────────
        minimal: (
            <Image systemName={activeIcon} modifiers={[font({ size: 14 }), foregroundStyle(activeColor)]} />
        ),

        // ── Expanded Views ─────────────────────────────────────────────────────
        expandedLeading: (
            <VStack alignment="leading" modifiers={[padding({ leading: 14, top: 12 })]}>
                <VStack modifiers={[frame({ width: 44, height: 44, alignment: 'center' }), background(`${activeColor}40`), cornerRadius(25)]}>
                    <Image systemName={activeIcon} modifiers={[font({ size: 22 }), foregroundStyle(activeColor)]} />
                </VStack>
                <Text modifiers={[font({ size: 10, weight: 'black' }), foregroundStyle(activeColor), padding({ top: 8 })]}>BEY3A</Text>
            </VStack>
        ),

        expandedTrailing: (
            <VStack alignment="trailing" modifiers={[padding({ trailing: 14, top: 12 })]}>
                <VStack alignment="trailing">
                    <Text modifiers={[font({ size: 24, weight: 'heavy' }), foregroundStyle(activeColor)]}>
                        {isDelivered ? '✓' : String(etaMinutes)}
                    </Text>
                    <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(activeColor)]}>
                        {isDelivered ? 'LIVRÉ' : 'MINUTES'}
                    </Text>
                </VStack>
            </VStack>
        ),

        expandedBottom: (
            <VStack modifiers={[padding({ horizontal: 16, bottom: 14 }), frame({ maxWidth: 9999 })]}>
                {!isDelivered && (
                    <ProgressView value={progress} modifiers={[foregroundStyle(activeColor), padding({ bottom: 14 })]} />
                )}
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <VStack alignment="leading">
                        <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
                            {status}
                        </Text>
                        <Text modifiers={[font({ size: 12 }), foregroundStyle('#8E8E93')]}>
                            {isDelivered ? 'Commande terminée avec succès' : `Votre colis #${String(orderId).split('#').pop()}`}
                        </Text>
                    </VStack>
                    <Spacer />
                    <VStack modifiers={[frame({ width: 32, height: 32, alignment: 'trailing' }), padding({ trailing: 2 })]}>
                        {isDelivered ? (
                            <Image systemName={"checkmark.circle.fill" as any} modifiers={[font({ size: 20 }), foregroundStyle('#34C759')]} />
                        ) : (
                            <Image systemName={"box.truck.fill" as any} modifiers={[font({ size: 20 }), foregroundStyle(activeColor)]} />
                        )}
                    </VStack>
                </HStack>
            </VStack>
        ),
    };
};

export default createLiveActivity('OrderTrackingActivity', DeliveryActivity);

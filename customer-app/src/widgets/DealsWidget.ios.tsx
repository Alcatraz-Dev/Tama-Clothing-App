import { VStack, HStack, Text, Spacer, Image, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetBase } from 'expo-widgets';

const BEY3A_PURPLE = '#8A2BE2';
const RemoteImage = Image as any;

const DealsWidgetView = (props: WidgetBase<any>) => {
    'widget';
    const {
        family,
        activeDeals = [],
        currency = 'TND',
        isDark = true
    } = props || {};

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryColor = isDark ? '#ffffff' : '#1c1c1e';
    const secondaryColor = isDark ? '#8E8E93' : '#636366';
    const secondaryStyle = foregroundStyle(secondaryColor);
    const accentStyle = foregroundStyle(BEY3A_PURPLE);

    // ── Small ─────────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const deal = activeDeals[0];
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                background(bgColor)
            ]}>
                <ZStack modifiers={[frame({ maxWidth: 9999, height: 90 })]}>
                    {deal?.imageUrl && (
                        <RemoteImage source={{ uri: deal.imageUrl }} modifiers={[frame({ maxWidth: 9999, height: 90 }), cornerRadius(0)]} />
                    )}
                    <VStack modifiers={[frame({ maxWidth: 9999, height: 90, alignment: 'topTrailing' })]}>
                        <VStack modifiers={[
                            padding({ horizontal: 6, vertical: 4 }),
                            background('#FF3B30'),
                            cornerRadius(8)
                        ]}>
                            <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle('#ffffff')]}>-{deal?.discount || 20}%</Text>
                        </VStack>
                    </VStack>
                </ZStack>

                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 10, weight: 'black' }), secondaryStyle]}>FLASH SALE</Text>
                    <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(primaryColor), padding({ top: 1 })]}>
                        {deal?.title || 'Offre Spéciale'}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium/Large ──────────────────────────────────────────────────────────
    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            background(bgColor)
        ]}>
            <HStack modifiers={[
                padding({ horizontal: 14, vertical: 10 }),
                frame({ maxWidth: 9999 }),
                background(cardBgColor)
            ]}>
                <Image systemName="bolt.fill" modifiers={[font({ size: 18 }), foregroundStyle("#FFCC00")]} />
                <Text modifiers={[font({ size: 14, weight: 'black' }), foregroundStyle(primaryColor), padding({ leading: 6 })]}>
                    Offres Flash Bey3a
                </Text>
                <Spacer />
                <Text modifiers={[font({ size: 11, weight: 'bold' }), accentStyle]}>VOIR TOUT</Text>
            </HStack>

            <HStack modifiers={[padding({ horizontal: 10, vertical: 10 }), frame({ maxWidth: 9999 })]}>
                {activeDeals.slice(0, 3).map((deal: any, i: number) => (
                    <VStack key={i} modifiers={[padding({ horizontal: 4 }), frame({ width: family === 'systemMedium' ? 100 : 140 })]}>
                        <ZStack>
                            {deal.imageUrl && (
                                <RemoteImage source={{ uri: deal.imageUrl }} modifiers={[frame({ maxWidth: 9999, height: 80 }), cornerRadius(10), shadow({ radius: 2 })]} />
                            )}
                            <VStack modifiers={[frame({ maxWidth: 9999, height: 80, alignment: 'bottomLeading' })]}>
                                <VStack modifiers={[padding({ horizontal: 4, vertical: 2 }), background('#FF3B30'), cornerRadius(6)]}>
                                    <Text modifiers={[font({ size: 8, weight: 'heavy' }), foregroundStyle('#ffffff')]}>-{deal.discount}%</Text>
                                </VStack>
                            </VStack>
                        </ZStack>
                        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(primaryColor), padding({ top: 4 })]}>
                            {deal.title?.slice(0, 15)}
                        </Text>
                        <Text modifiers={[font({ size: 10, weight: 'bold' }), accentStyle]}>{deal.salePrice} {currency}</Text>
                    </VStack>
                ))}
            </HStack>
        </VStack>
    );
};

export default createWidget('DealsWidget', DealsWidgetView);

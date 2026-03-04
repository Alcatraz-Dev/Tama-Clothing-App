import { VStack, HStack, Text, Spacer, Image, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetBase } from 'expo-widgets';

const DealsWidgetView = (props: WidgetBase<any>) => {
    'widget';
    const {
        family,
        activeDeals = [],
        currency = 'TND',
        isDark = true
    } = props || {};

    const BEY3A_PURPLE = '#8A2BE2';
    const bgColor = { dynamic: { light: '#f2f2f7', dark: '#1c1c1e' } } as any;
    const cardBgColor = { dynamic: { light: '#ffffff', dark: '#2c2c2e' } } as any;
    const primaryColor = { dynamic: { light: '#1c1c1e', dark: '#ffffff' } } as any;
    const secondaryColor = '#8E8E93';

    // ── Small ─────────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const deal = activeDeals[0];
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                background(bgColor)
            ]}>
                <VStack modifiers={[
                    frame({ maxWidth: 9999, height: 90, alignment: 'center' }),
                    background(BEY3A_PURPLE + '20')
                ]}>
                    <Image systemName="tag.fill" modifiers={[font({ size: 30 }), foregroundStyle(BEY3A_PURPLE)]} />
                </VStack>

                <VStack alignment="leading" modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999 })]}>
                    <Text modifiers={[font({ size: 10, weight: 'black' }), foregroundStyle(secondaryColor)]}>FLASH SALE</Text>
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
                <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(BEY3A_PURPLE)]}>VOIR TOUT</Text>
            </HStack>

            <HStack modifiers={[padding({ horizontal: 10, vertical: 10 }), frame({ maxWidth: 9999 })]}>
                {activeDeals.slice(0, 3).map((deal: any, i: number) => (
                    <VStack key={i} modifiers={[padding({ horizontal: 4 }), frame({ minWidth: 60, maxWidth: 120 })]}>
                        <VStack modifiers={[
                            frame({ height: 80, alignment: 'center' }),
                            cornerRadius(10),
                            background(cardBgColor)
                        ]}>
                            <Image systemName="gift.fill" modifiers={[font({ size: 24 }), foregroundStyle(BEY3A_PURPLE)]} />
                        </VStack>
                        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(primaryColor), padding({ top: 4 })]}>
                            {deal.title?.slice(0, 15)}
                        </Text>
                        <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(BEY3A_PURPLE)]}>{deal.salePrice} {currency}</Text>
                    </VStack>
                ))}
            </HStack>
        </VStack>
    );
};

export default createWidget('DealsWidget', DealsWidgetView);

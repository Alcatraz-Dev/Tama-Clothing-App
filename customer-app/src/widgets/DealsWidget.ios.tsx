import { VStack, HStack, Text, Spacer, ZStack, Image } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow, offset, strikethrough } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type Deal = {
    title: string;
    description: string;
    salePrice: number;
    originalPrice: number;
    id: string;
    imageUrl?: string;
};

export type DealsWidgetProps = {
    activeDeals?: Deal[];
    currency?: string;
};

const DealsWidgetComponent = (props: WidgetBase<DealsWidgetProps>) => {
    'widget';
    const {
        family,
        activeDeals = [],
        currency = 'TND'
    } = props;

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const redColor = foregroundStyle({ type: 'color', color: '#FF453A' });
    const orangeGradient = foregroundStyle({
        type: 'linearGradient',
        colors: ['#FF9F0A', '#FF453A'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
    });

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        const firstDeal = activeDeals.length > 0 ? activeDeals[0] : null;
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                🏷️ {firstDeal ? firstDeal.title : 'Aucune offre'}
            </Text>
        );
    }

    if (family === 'accessoryRectangular') {
        const firstDeal = activeDeals.length > 0 ? activeDeals[0] : null;
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' })]}>
                <Image systemName="tag.fill" modifiers={[font({ size: 18 }), orangeGradient]} />
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                        {firstDeal ? firstDeal.title : 'Offres'}
                    </Text>
                    {firstDeal && (
                        <Text modifiers={[font({ size: 12 }), secondaryStyle]}>
                            {firstDeal.salePrice.toFixed(0)} {currency}
                        </Text>
                    )}
                </VStack>
            </HStack>
        );
    }

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const count = activeDeals.length;
        const topDeal = activeDeals.length > 0 ? activeDeals[0] : null;

        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }),
                padding({ all: 16 }),
                background('#1C1C1E')
            ]}>
                <HStack>
                    <ZStack modifiers={[
                        frame({ width: 32, height: 32 }),
                        cornerRadius(16),
                        background('#2c2c2e'),
                        frame({ alignment: 'center' })
                    ]}>
                        <Image systemName="bolt.fill" modifiers={[font({ size: 16 }), orangeGradient]} />
                    </ZStack>
                    <Spacer />
                    {topDeal && (
                        <VStack modifiers={[
                            padding({ horizontal: 6, vertical: 2 }),
                            cornerRadius(4),
                            background('#FF453A')
                        ]}>
                            <Text modifiers={[font({ weight: 'bold', size: 10 }), foregroundStyle('#FFFFFF')]}>-{((1 - topDeal.salePrice / topDeal.originalPrice) * 100).toFixed(0)}%</Text>
                        </VStack>
                    )}
                </HStack>
                <Spacer />
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'medium', size: 12 }), secondaryStyle]}>OFFRES</Text>
                    <Text modifiers={[font({ weight: 'black', size: 20 }), foregroundStyle('#FFFFFF')]}>
                        {count > 0 ? `${count} Actives` : 'Aucune'}
                    </Text>
                    <Text modifiers={[font({ size: 11 }), secondaryStyle, padding({ top: 2 })]}>Économisez maintenant</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    const isLarge = family === 'systemLarge';
    const showCount = isLarge ? 5 : 2;
    const headerPadding = isLarge ? 16 : 12;
    const itemPadding = isLarge ? 8 : 6;

    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            padding({ all: 0 }),
            background('#1C1C1E')
        ]}>
            {/* Header section with gradient */}
            <VStack modifiers={[
                frame({ maxWidth: 9999 }),
                padding({ horizontal: headerPadding, top: headerPadding, bottom: isLarge ? 12 : 8 }),
                background('#2c2c2e')
            ]}>
                <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'black', size: isLarge ? 18 : 16 }), foregroundStyle('#FFFFFF')]}>Offres du Jour</Text>
                        <Text modifiers={[font({ size: 11 }), secondaryStyle]}>Meilleures réductions</Text>
                    </VStack>
                    <Spacer />
                    <Image systemName="percent" modifiers={[font({ size: isLarge ? 18 : 16, weight: 'bold' }), orangeGradient]} />
                </HStack>
            </VStack>

            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ horizontal: headerPadding, vertical: isLarge ? 8 : 4 })]}>
                {activeDeals.length === 0 ? (
                    <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 80, alignment: 'center' })]}>
                        <Image systemName="bag" modifiers={[font({ size: 30 }), secondaryStyle, padding({ bottom: 8 })]} />
                        <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Revenez plus tard</Text>
                    </VStack>
                ) : (
                    activeDeals.slice(0, showCount).map((deal: any, i: number) => (
                        <HStack key={i} modifiers={[
                            padding({ vertical: itemPadding }),
                            frame({ maxWidth: 9999, alignment: 'center' })
                        ]}>
                            {/* Product Image Placeholder */}
                            <ZStack modifiers={[
                                frame({ width: isLarge ? 44 : 36, height: isLarge ? 44 : 36 }),
                                cornerRadius(8),
                                background('#2c2c2e'),
                                frame({ alignment: 'center' })
                            ]}>
                                <Image systemName="tag.fill" modifiers={[font({ size: isLarge ? 18 : 14 }), secondaryStyle]} />
                            </ZStack>

                            <VStack modifiers={[padding({ leading: 10 }), frame({ alignment: 'leading' })]}>
                                <Text modifiers={[font({ weight: 'bold', size: isLarge ? 15 : 13 }), foregroundStyle('#FFFFFF')]}>
                                    {deal.title.length > (isLarge ? 25 : 20) ? deal.title.slice(0, isLarge ? 25 : 20) + '…' : deal.title}
                                </Text>
                                <HStack modifiers={[frame({ alignment: 'leading' })]}>
                                    <Text modifiers={[font({ weight: 'black', size: isLarge ? 15 : 13 }), orangeGradient]}>
                                        {deal.salePrice.toFixed(0)} {currency}
                                    </Text>
                                    <Text modifiers={[font({ size: 11 }), secondaryStyle, padding({ leading: 6 }), strikethrough({ isActive: true, pattern: 'solid' })]}>
                                        {deal.originalPrice.toFixed(0)} {currency}
                                    </Text>
                                </HStack>
                            </VStack>
                            <Spacer />
                            <VStack modifiers={[
                                padding({ horizontal: 6, vertical: 3 }),
                                cornerRadius(10),
                                background('rgba(255, 69, 58, 0.15)')
                            ]}>
                                <Text modifiers={[font({ weight: 'bold', size: 9 }), redColor]}>
                                    -{((1 - deal.salePrice / deal.originalPrice) * 100).toFixed(0)}%
                                </Text>
                            </VStack>
                        </HStack>
                    ))
                )}
            </VStack>
            {isLarge && activeDeals.length > showCount && (
                <VStack modifiers={[padding({ horizontal: 16, bottom: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Spacer />
                    <Text modifiers={[font({ size: 11 }), secondaryStyle]}>+ {activeDeals.length - showCount} autres offres</Text>
                </VStack>
            )}
        </VStack>
    );
};

const DealsWidget = createWidget('DealsWidget', DealsWidgetComponent);
export default DealsWidget;

DealsWidget.updateSnapshot({
    activeDeals: [
        { id: '1', title: 'Collection d\'Été Active', description: '50% de réduction', salePrice: 45.00, originalPrice: 90.00, imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80' },
        { id: '2', title: 'Sneakers Flash Sale', description: 'Offre limitée', salePrice: 120.00, originalPrice: 200.00, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
        { id: '3', title: 'Accessoires Premium', description: 'Prix exclusif', salePrice: 35.00, originalPrice: 50.00 }
    ],
    currency: 'TND'
});


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
    isDark?: boolean;
};

const DealsWidgetComponent = (props: WidgetBase<DealsWidgetProps>) => {
    'widget';
    const {
        family,
        activeDeals = [],
        currency = 'TND',
        isDark = true
    } = props;

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const accentStyle = foregroundStyle({ type: 'color', color: '#ff3b30' });
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

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ size: 22 })]}>🔥</Text>
            </VStack>
        );
    }

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const firstDeal = activeDeals.length > 0 ? activeDeals[0] : null;
        const discount = firstDeal ? ((1 - firstDeal.salePrice / firstDeal.originalPrice) * 100).toFixed(0) : '0';

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
                    <Text modifiers={[font({ size: 36 })]}>🔥</Text>
                </VStack>

                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 12 }), secondaryStyle]}>PROMOS</Text>
                    {firstDeal ? (
                        <>
                            <Text modifiers={[font({ weight: 'black', size: 14 }), foregroundStyle(primaryTextColor), padding({ top: 1 })]}>
                                {firstDeal.title.length > 15 ? firstDeal.title.slice(0, 15) + '…' : firstDeal.title}
                            </Text>
                            <Text modifiers={[font({ weight: 'bold', size: 13 }), accentStyle]}>
                                -{discount}%
                            </Text>
                        </>
                    ) : (
                        <Text modifiers={[font({ size: 11 }), secondaryStyle]}>Aucune offre</Text>
                    )}
                </VStack>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    const isLarge = family === 'systemLarge';
    const showCount = isLarge ? 5 : 2;
    const headerPadding = isLarge ? 16 : 12;

    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            padding({ all: 0 }),
            background(bgColor)
        ]}>
            {/* Header */}
            <HStack modifiers={[
                frame({ maxWidth: 9999 }),
                padding({ horizontal: headerPadding, vertical: isLarge ? 12 : 8 }),
                background(cardBgColor)
            ]}>
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'black', size: isLarge ? 20 : 16 }), foregroundStyle(primaryTextColor)]}>Offres Flash</Text>
                    <Text modifiers={[font({ size: 11 }), secondaryStyle]}>Fin de saison</Text>
                </VStack>
                <Spacer />
                <VStack modifiers={[
                    padding({ horizontal: 8, vertical: 4 }),
                    cornerRadius(8),
                    background('#ff3b30')
                ]}>
                    <Text modifiers={[font({ weight: 'black', size: 10 }), foregroundStyle('#ffffff')]}>LIVE</Text>
                </VStack>
            </HStack>

            {/* Content */}
            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ all: headerPadding })]}>
                {activeDeals.length === 0 ? (
                    <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 80, alignment: 'center' })]}>
                        <Text modifiers={[font({ size: 30 }), padding({ bottom: 8 })]}>🛍️</Text>
                        <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Revenez plus tard</Text>
                    </VStack>
                ) : (
                    <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                        {activeDeals.slice(0, showCount).map((deal: any, i: number) => {
                            const discount = ((1 - deal.salePrice / deal.originalPrice) * 100).toFixed(0);
                            return (
                                <HStack key={i} modifiers={[
                                    padding({ bottom: (i === activeDeals.slice(0, showCount).length - 1) ? 0 : isLarge ? 12 : 8 }),
                                    frame({ maxWidth: 9999, alignment: 'leading' })
                                ]}>
                                    <VStack modifiers={[
                                        frame({ width: isLarge ? 40 : 34, height: isLarge ? 40 : 34, alignment: 'center' }),
                                        cornerRadius(8),
                                        background(cardBgColor),
                                        shadow({ radius: 2, y: 1, color: 'rgba(0,0,0,0.1)' })
                                    ]}>
                                        <Text modifiers={[font({ size: isLarge ? 20 : 16 })]}>📦</Text>
                                    </VStack>
                                    <VStack modifiers={[padding({ leading: (isLarge ? 12 : 8) }), frame({ alignment: 'leading' })]}>
                                        <Text modifiers={[font({ weight: 'bold', size: isLarge ? 14 : 12 }), foregroundStyle(primaryTextColor)]}>
                                            {deal.title.length > (isLarge ? 25 : 20) ? deal.title.slice(0, isLarge ? 25 : 20) + '…' : deal.title}
                                        </Text>
                                        <HStack>
                                            <Text modifiers={[font({ weight: 'black', size: isLarge ? 15 : 13 }), accentStyle]}>
                                                {deal.salePrice.toFixed(0)} {currency}
                                            </Text>
                                            <Text modifiers={[
                                                font({ size: isLarge ? 11 : 10 }),
                                                secondaryStyle,
                                                padding({ leading: 6 }),
                                                strikethrough({ isActive: true, pattern: 'solid' })
                                            ]}>
                                                {deal.originalPrice.toFixed(0)} {currency}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <Spacer />
                                    <VStack modifiers={[
                                        padding({ horizontal: 6, vertical: 2 }),
                                        cornerRadius(6),
                                        background(isDark ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.1)')
                                    ]}>
                                        <Text modifiers={[font({ weight: 'bold', size: 10 }), accentStyle]}>-{discount}%</Text>
                                    </VStack>
                                </HStack>
                            );
                        })}
                    </VStack>
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


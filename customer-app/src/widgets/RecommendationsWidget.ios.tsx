import { VStack, HStack, Text, Spacer, ZStack, Image } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type ProductRecommendation = {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
};


export type RecommendationsWidgetProps = {
    products?: ProductRecommendation[];
    userId?: string;
    isDark?: boolean;
};

const RecommendationsWidgetComponent = (props: WidgetBase<RecommendationsWidgetProps>) => {
    'widget';
    const {
        family,
        products = [],
        isDark = true
    } = props;

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const purpleStyle = foregroundStyle({ type: 'color', color: '#AF52DE' });
    const purpleGradient = foregroundStyle({
        type: 'linearGradient',
        colors: ['#AF52DE', '#5856D6'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
    });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const count = products.length;
        const firstProduct = products.length > 0 ? products[0] : null;

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
                    <Image systemName="sparkles" modifiers={[font({ size: 36 }), purpleGradient]} />
                </VStack>

                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 12 }), secondaryStyle]}>POUR VOUS</Text>
                    <Text modifiers={[font({ weight: 'black', size: 14 }), purpleStyle, padding({ top: 1 })]}>
                        {count > 0 ? `${count} Articles` : 'Découvrir'}
                    </Text>
                    {firstProduct && (
                        <Text modifiers={[font({ size: 10 }), secondaryStyle, padding({ top: 1 })]}>
                            {firstProduct.name.length > 15 ? firstProduct.name.slice(0, 15) + '…' : firstProduct.name}
                        </Text>
                    )}
                </VStack>
            </VStack>
        );
    }


    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        const firstProduct = products.length > 0 ? products[0] : null;
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                ✨ {firstProduct ? `Choix: ${firstProduct.name}` : 'Voir les choix'}
            </Text>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Image systemName="sparkles" modifiers={[font({ size: 24 }), purpleGradient]} />
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    const isLarge = family === 'systemLarge';
    const showCount = isLarge ? 4 : 2;
    const headerPadding = isLarge ? 16 : 12;
    const itemWidth = isLarge ? 135 : 125;
    const imageHeight = isLarge ? 100 : 85;

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
                        <Text modifiers={[font({ weight: 'black', size: isLarge ? 18 : 16 }), foregroundStyle(primaryTextColor)]}>Choisis Pour Vous</Text>
                        <Text modifiers={[font({ size: 11 }), secondaryStyle]}>Selon votre style</Text>
                    </VStack>
                    <Spacer />
                    <Image systemName="sparkles" modifiers={[font({ size: isLarge ? 22 : 18 }), purpleGradient]} />
                </HStack>
            </VStack>

            <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'topLeading' }), padding({ horizontal: headerPadding, vertical: isLarge ? 12 : 8 })]}>
                {products.length === 0 ? (
                    <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 100, alignment: 'center' })]}>
                        <Image systemName="sparkles" modifiers={[font({ size: 30 }), secondaryStyle, padding({ bottom: 8 })]} />
                        <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Nouveautés bientôt</Text>
                    </VStack>
                ) : (
                    products.slice(0, showCount).map((item: any, i: number) => (
                        <VStack key={i} modifiers={[
                            padding({ leading: i === 0 ? 0 : isLarge ? 12 : 10 }),
                            frame({ alignment: 'leading', width: itemWidth })
                        ]}>
                            <VStack modifiers={[
                                frame({ width: itemWidth, height: imageHeight, alignment: 'center' }),
                                cornerRadius(12),
                                background(cardBgColor),
                                shadow({ radius: 4, y: 2, color: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)' })
                            ]}>
                                <Image systemName="handbag.fill" modifiers={[font({ size: isLarge ? 32 : 26 }), secondaryStyle]} />
                            </VStack>
                            <VStack modifiers={[padding({ top: 8 }), frame({ alignment: 'leading' })]}>
                                <Text modifiers={[font({ weight: 'bold', size: isLarge ? 13 : 11 }), foregroundStyle(primaryTextColor)]}>
                                    {item.name.length > (isLarge ? 20 : 15) ? item.name.slice(0, isLarge ? 20 : 15) + '…' : item.name}
                                </Text>
                                <Text modifiers={[font({ weight: 'black', size: isLarge ? 14 : 12 }), purpleStyle, padding({ top: 1 })]}>
                                    {item.price.toFixed(0)} TND
                                </Text>
                            </VStack>
                        </VStack>
                    ))
                )}
            </HStack>
        </VStack>
    );

};

const RecommendationsWidget = createWidget('RecommendationsWidget', RecommendationsWidgetComponent);
export default RecommendationsWidget;

RecommendationsWidget.updateSnapshot({
    products: [
        { id: '1', name: 'Veste en cuir', price: 199.99, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80' },
        { id: '2', name: 'Écharpe en laine', price: 29.50, imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500&q=80' },
        { id: '3', name: 'Robe en soie', price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1539109132381-31512579f3cf?w=500&q=80' }
    ]
});



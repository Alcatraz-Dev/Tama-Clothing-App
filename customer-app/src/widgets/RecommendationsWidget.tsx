import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type ProductRecommendation = {
    id: string;
    name: string;
    price: number;
    image?: string;
};

export type RecommendationsWidgetProps = {
    products?: ProductRecommendation[];
    userId?: string;
};

const RecommendationsWidgetComponent = (props: WidgetBase<RecommendationsWidgetProps>) => {
    'widget';
    const {
        family,
        products = []
    } = props;

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const purpleStyle = foregroundStyle({ type: 'color', color: '#AF52DE' });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const count = products.length;
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ all: 16 })]}>
                <Text modifiers={[font({ size: 28 })]}>✨</Text>
                <Spacer />
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 18 })]}>For You</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 22 }), purpleStyle]}>
                        {count > 0 ? `${count} Items` : 'Discover'}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        const firstProduct = products.length > 0 ? products[0] : null;
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                ✨ {firstProduct ? `Pick: ${firstProduct.name}` : 'Check for Picks'}
            </Text>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ size: 24 })]}>✨</Text>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: 16 })]}>
            <HStack modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 20 })]}>Picks For You</Text>
                    <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Based on your style</Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 32 })]}>✨</Text>
            </HStack>

            <HStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                {products.length === 0 ? (
                    <Text modifiers={[font({ size: 14 }), secondaryStyle]}>New arrivals coming soon</Text>
                ) : (
                    products.slice(0, family === 'systemLarge' ? 4 : 2).map((item: any, i: number) => (
                        <VStack key={i} modifiers={[padding({ leading: i === 0 ? 0 : 12 }), frame({ alignment: 'leading' })]}>
                            <VStack modifiers={[frame({ width: 64, height: 64, alignment: 'center' }), cornerRadius(12), foregroundStyle({ type: 'color', color: '#f2f2f7' })]}>
                                <Text modifiers={[font({ size: 32 })]}>👕</Text>
                            </VStack>
                            <VStack modifiers={[padding({ top: 8 }), frame({ alignment: 'leading' })]}>
                                <Text modifiers={[font({ weight: 'semibold', size: 14 })]}>
                                    {item.name.length > 15 ? item.name.slice(0, 15) + '…' : item.name}
                                </Text>
                                <Text modifiers={[font({ weight: 'bold', size: 13 }), purpleStyle]}>
                                    ${item.price.toFixed(0)}
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
        { id: '1', name: 'Leather Jacket', price: 199.99 },
        { id: '2', name: 'Woolen Scarf', price: 29.50 },
        { id: '3', name: 'Silk Dress', price: 85.00 }
    ]
});

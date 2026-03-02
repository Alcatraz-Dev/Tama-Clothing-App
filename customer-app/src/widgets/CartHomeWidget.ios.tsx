import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

const CartHomeWidget = (props: WidgetBase<any>) => {
    'widget';
    const { family, itemCount = 0, totalAmount = 0, currency = 'TND', items = [] } = props;

    const titleFont = font({ weight: 'bold', size: 16 });
    const priceFont = font({ weight: 'bold', size: 20 });
    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const formattedTotal = `${totalAmount.toFixed(0)} ${currency}`;

        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }),
                padding({ all: 12 }),
                background('#1C1C1E') // Dark background
            ]}>
                <HStack modifiers={[frame({ maxWidth: 9999 })]}>
                    <Text modifiers={[font({ size: 24 })]}>🛒</Text>
                    <Spacer />
                    <VStack modifiers={[padding({ horizontal: 6, vertical: 2 }), cornerRadius(10), background('#0A84FF')]}>
                        <Text modifiers={[font({ weight: 'bold', size: 11 }), foregroundStyle('#FFFFFF')]}>{itemCount}</Text>
                    </VStack>
                </HStack>
                <Spacer />
                <Text modifiers={[titleFont, foregroundStyle('#FFFFFF')]}>Panier</Text>
                <Text modifiers={[priceFont, foregroundStyle('#FFFFFF')]}>{formattedTotal}</Text>
            </VStack>
        );
    }

    // ── Medium Widget ────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        const formattedTotal = `${totalAmount.toFixed(0)} ${currency}`;

        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ horizontal: 14, vertical: 10 })]}>
                <VStack modifiers={[frame({ maxWidth: 100, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 32 }), padding({ bottom: 2 })]}>🛒</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 16 })]}>Panier</Text>
                </VStack>

                <Spacer />

                <VStack modifiers={[frame({ alignment: 'trailing' })]}>
                    <Text modifiers={[font({ weight: 'semibold', size: 13 }), secondaryStyle]}>{itemCount} articles</Text>
                    <Text modifiers={[font({ weight: 'black', size: 22 }), padding({ top: 1 })]}>
                        {formattedTotal}
                    </Text>
                </VStack>
            </HStack>
        );
    }

    // ── Large Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemLarge' || family === 'systemExtraLarge') {
        const formattedTotal = `${totalAmount.toFixed(0)} ${currency}`;

        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: 14 })]}>
                <HStack modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999 })]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'black', size: 20 })]}>Panier d'achat</Text>
                        <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{itemCount} articles prêts</Text>
                    </VStack>
                    <Spacer />
                    <Text modifiers={[font({ size: 28 })]}>🛒</Text>
                </HStack>

                <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    {items.length === 0 ? (
                        <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 120, alignment: 'center' })]}>
                            <Text modifiers={[font({ size: 40 }), padding({ bottom: 10 })]}>🛍️</Text>
                            <Text modifiers={[font({ size: 14, weight: 'medium' }), secondaryStyle]}>Votre panier vous attend</Text>
                        </VStack>
                    ) : (
                        <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ bottom: 8 })]}>
                                {items.slice(0, 4).map((item: any, i: number) => (
                                    <HStack key={i} modifiers={[padding({ vertical: 4 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                        <VStack modifiers={[frame({ width: 28, height: 28, alignment: 'center' }), cornerRadius(6), foregroundStyle({ type: 'color', color: '#2c2c2e' })]}>
                                            <Text modifiers={[font({ size: 16 })]}>📦</Text>
                                        </VStack>
                                        <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                                            <Text modifiers={[font({ weight: 'semibold', size: 13 })]}>
                                                {item.name.length > 22 ? item.name.slice(0, 22) + '…' : item.name}
                                            </Text>
                                            <Text modifiers={[font({ size: 11 }), secondaryStyle]}>{item.price.toFixed(0)} {currency}</Text>
                                        </VStack>
                                    </HStack>
                                ))}
                            </VStack>
                            <Spacer />
                            <VStack modifiers={[padding({ top: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                <Text modifiers={[font({ size: 11 }), secondaryStyle]}>TOTAL</Text>
                                <Text modifiers={[font({ weight: 'black', size: 26 })]}>{formattedTotal}</Text>
                            </VStack>
                        </VStack>
                    )}
                </VStack>
            </VStack>
        );
    }

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                🛒 {itemCount} articles ({totalAmount.toFixed(0)} {currency})
            </Text>
        );
    }

    if (family === 'accessoryRectangular') {
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 20 })]}>🛒</Text>
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 14 })]}>{itemCount} articles</Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{totalAmount.toFixed(0)} {currency}</Text>
                </VStack>
            </HStack>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ size: 24 })]}>🛒</Text>
            </VStack>
        );
    }

    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
            <Text modifiers={[font({ weight: 'bold', size: 16 })]}>🛒{itemCount}</Text>
        </VStack>
    );
};

const CartWidget = createWidget('CartWidget', CartHomeWidget);
export default CartWidget;

CartWidget.updateSnapshot({
    itemCount: 3,
    totalAmount: 149.99,
    currency: 'TND',
    items: [
        { name: 'Classic White T-Shirt', price: 29.99 },
        { name: 'Denim Jeans', price: 79.99 },
        { name: 'Sneakers', price: 40.01 }
    ]
});

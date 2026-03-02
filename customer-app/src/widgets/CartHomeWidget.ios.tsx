import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

const CartHomeWidget = (props: WidgetBase<any>) => {
    'widget';
    const { family, itemCount = 0, totalAmount = 0, currency = 'TND', items = [], isDark = true } = props;

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';

    const titleFont = font({ weight: 'bold', size: 16 });
    const priceFont = font({ weight: 'black', size: 22 });
    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const formattedTotal = `${totalAmount.toFixed(0)} ${currency}`;

        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }),
                padding({ all: 12 }),
                background(bgColor)
            ]}>
                <HStack modifiers={[frame({ maxWidth: 9999 })]}>
                    <Text modifiers={[font({ size: 28 })]}>🛒</Text>
                    <Spacer />
                    <VStack modifiers={[padding({ horizontal: 6, vertical: 2 }), cornerRadius(10), background('#0A84FF')]}>
                        <Text modifiers={[font({ weight: 'bold', size: 12 }), foregroundStyle('#FFFFFF')]}>{itemCount}</Text>
                    </VStack>
                </HStack>
                <Spacer />
                <Text modifiers={[titleFont, foregroundStyle(primaryTextColor)]}>Panier</Text>
                <Text modifiers={[priceFont, foregroundStyle(primaryTextColor)]}>{formattedTotal}</Text>
            </VStack>
        );
    }

    // ── Medium Widget ────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        const formattedTotal = `${totalAmount.toFixed(0)} ${currency}`;

        return (
            <HStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }),
                padding({ horizontal: 16, vertical: 12 }),
                background(bgColor)
            ]}>
                <VStack modifiers={[frame({ maxWidth: 100, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 36 }), padding({ bottom: 4 })]}>🛒</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(primaryTextColor)]}>Panier</Text>
                </VStack>

                <Spacer />

                <VStack modifiers={[frame({ alignment: 'trailing' })]}>
                    <Text modifiers={[font({ weight: 'semibold', size: 14 }), secondaryStyle]}>{itemCount} articles</Text>
                    <Text modifiers={[font({ weight: 'black', size: 24 }), foregroundStyle(primaryTextColor), padding({ top: 1 })]}>
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
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                padding({ all: 0 }),
                background(bgColor)
            ]}>
                <HStack modifiers={[
                    padding({ horizontal: 16, vertical: 14 }),
                    frame({ maxWidth: 9999 }),
                    background(cardBgColor)
                ]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'black', size: 20 }), foregroundStyle(primaryTextColor)]}>Panier d'achat</Text>
                        <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{itemCount} articles prêts</Text>
                    </VStack>
                    <Spacer />
                    <Text modifiers={[font({ size: 28 })]}>🛒</Text>
                </HStack>

                <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ all: 16 })]}>
                    {items.length === 0 ? (
                        <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 120, alignment: 'center' })]}>
                            <Text modifiers={[font({ size: 40 }), padding({ bottom: 10 })]}>🛍️</Text>
                            <Text modifiers={[font({ size: 14, weight: 'medium' }), secondaryStyle]}>Votre panier vous attend</Text>
                        </VStack>
                    ) : (
                        <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ bottom: 8 })]}>
                                {items.slice(0, 4).map((item: any, i: number) => (
                                    <HStack key={i} modifiers={[padding({ vertical: 6 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                        <VStack modifiers={[
                                            frame({ width: 34, height: 34, alignment: 'center' }),
                                            cornerRadius(8),
                                            background(cardBgColor),
                                            shadow({ radius: 2, y: 1, color: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' })
                                        ]}>
                                            <Text modifiers={[font({ size: 18 })]}>📦</Text>
                                        </VStack>
                                        <VStack modifiers={[padding({ leading: 10 }), frame({ alignment: 'leading' })]}>
                                            <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(primaryTextColor)]}>
                                                {item.name.length > 25 ? item.name.slice(0, 25) + '…' : item.name}
                                            </Text>
                                            <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{item.price.toFixed(0)} {currency}</Text>
                                        </VStack>
                                    </HStack>
                                ))}
                            </VStack>
                            <Spacer />
                            <VStack modifiers={[padding({ top: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                <Text modifiers={[font({ size: 12 }), secondaryStyle]}>TOTAL</Text>
                                <Text modifiers={[font({ weight: 'black', size: 28 }), foregroundStyle(primaryTextColor)]}>{formattedTotal}</Text>
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

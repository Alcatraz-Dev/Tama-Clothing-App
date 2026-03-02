import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

const CartHomeWidget = (props: WidgetBase<any>) => {
    'widget';
    const { family, itemCount = 0, totalAmount = 0, currency = 'USD', items = [] } = props;

    const titleFont = font({ weight: 'bold', size: 18 });
    const priceFont = font({ weight: 'bold', size: 22 });
    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const formattedTotal = `${currency}${totalAmount.toFixed(0)}`;
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ all: 16 })]}>
                <HStack modifiers={[frame({ maxWidth: 9999 })]}>
                    <Text modifiers={[font({ size: 28 })]}>🛒</Text>
                    <Spacer />
                    <VStack modifiers={[padding({ all: 4 }), frame({ minWidth: 22, minHeight: 22 }), cornerRadius(11), foregroundStyle({ type: 'color', color: '#0A84FF' })]}>
                        <VStack modifiers={[cornerRadius(11), foregroundStyle({ type: 'color', color: '#ffffff' })]}>
                            <Text modifiers={[font({ weight: 'bold', size: 12 })]}>{itemCount}</Text>
                        </VStack>
                    </VStack>
                </HStack>
                <Spacer />
                <Text modifiers={[titleFont]}>Panier</Text>
                <Text modifiers={[priceFont]}>{formattedTotal}</Text>
            </VStack>
        );
    }

    // ── Medium Widget ────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        const formattedTotal = `${currency}${totalAmount.toFixed(2)}`;
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ horizontal: 16, vertical: 12 })]}>
                <VStack modifiers={[frame({ maxWidth: 120, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 36 }), padding({ bottom: 4 })]}>🛒</Text>
                    <Text modifiers={[titleFont]}>Panier</Text>
                </VStack>

                <Spacer />

                <VStack modifiers={[frame({ alignment: 'trailing' })]}>
                    <Text modifiers={[font({ weight: 'semibold', size: 14 }), secondaryStyle]}>{itemCount} articles</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 24 }), padding({ top: 2 })]}>
                        {formattedTotal}
                    </Text>
                </VStack>
            </HStack>
        );
    }

    // ── Large Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemLarge' || family === 'systemExtraLarge') {
        const formattedTotal = `${currency}${totalAmount.toFixed(2)}`;
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: 20 })]}>
                <HStack modifiers={[padding({ bottom: 16 }), frame({ maxWidth: 9999 })]}>
                    <VStack modifiers={[frame({ alignment: 'leading' })]}>
                        <Text modifiers={[font({ weight: 'black', size: 24 })]}>Panier d'achat</Text>
                        <Text modifiers={[font({ size: 13 }), secondaryStyle]}>{itemCount} colis prêts</Text>
                    </VStack>
                    <Spacer />
                    <Text modifiers={[font({ size: 32 })]}>🛒</Text>
                </HStack>

                <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    {items.length === 0 ? (
                        <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 150, alignment: 'center' })]}>
                            <Text modifiers={[font({ size: 50 }), padding({ bottom: 12 })]}>🛍️</Text>
                            <Text modifiers={[font({ size: 16, weight: 'medium' }), secondaryStyle]}>Votre panier vous attend</Text>
                        </VStack>
                    ) : (
                        <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' }), padding({ bottom: 12 })]}>
                                {items.slice(0, 4).map((item: any, i: number) => (
                                    <HStack key={i} modifiers={[padding({ vertical: 6 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                        <VStack modifiers={[frame({ width: 32, height: 32, alignment: 'center' }), cornerRadius(6), foregroundStyle({ type: 'color', color: '#2c2c2e' })]}>
                                            <Text modifiers={[font({ size: 20 })]}>📦</Text>
                                        </VStack>
                                        <VStack modifiers={[padding({ leading: 10 }), frame({ alignment: 'leading' })]}>
                                            <Text modifiers={[font({ weight: 'semibold', size: 15 })]}>
                                                {item.name.length > 25 ? item.name.slice(0, 25) + '…' : item.name}
                                            </Text>
                                            <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{currency}{item.price.toFixed(2)}</Text>
                                        </VStack>
                                    </HStack>
                                ))}
                            </VStack>
                            <Spacer />
                            <VStack modifiers={[padding({ top: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                                <Text modifiers={[font({ size: 12 }), secondaryStyle]}>TOTAL</Text>
                                <Text modifiers={[font({ weight: 'bold', size: 28 })]}>{formattedTotal}</Text>
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
                🛒 {itemCount} articles ({currency}{totalAmount.toFixed(0)})
            </Text>
        );
    }

    if (family === 'accessoryRectangular') {
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 20 })]}>🛒</Text>
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 14 })]}>{itemCount} articles</Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>{currency}{totalAmount.toFixed(0)}</Text>
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
    currency: 'USD',
    items: [
        { name: 'Classic White T-Shirt', price: 29.99 },
        { name: 'Denim Jeans', price: 79.99 },
        { name: 'Sneakers', price: 40.01 }
    ]
});

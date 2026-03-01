/**
 * CartHomeWidget
 *
 * iOS Home Screen Widget for Shopping Cart.
 * Uses @expo/ui/swift-ui components (SwiftUI-based) — NOT React Native.
 * This file is compiled separately into the widget extension target.
 *
 * To display on home screen: user long-presses home screen → + → "Bey3a" → Cart Widget
 * To update data from app: call CartWidget.updateSnapshot({ ... }) anywhere in your RN code.
 */

import { VStack, HStack, Text, Image } from '@expo/ui/swift-ui';
import {
    font,
    foregroundStyle,
    padding,
    cornerRadius,
    frame,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartWidgetItem = {
    name: string;
    price: number;
    imageUrl?: string;
};

export type CartWidgetProps = {
    itemCount: number;
    totalAmount: number;
    currency: string;
    items: CartWidgetItem[];
};

// ─── Widget Component ─────────────────────────────────────────────────────────

const CartHomeWidget = (props: WidgetBase<CartWidgetProps>) => {
    'widget';

    const {
        itemCount = 0,
        totalAmount = 0,
        currency = 'TND',
        items = [],
        family
    } = props;

    const formattedTotal = `${currency} ${totalAmount.toFixed(2)}`;
    const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

    if (family === 'systemSmall') {
        return (
            <VStack
                modifiers={[
                    frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' }),
                    padding({ all: 16 }),
                ]}
            >
                <Text
                    modifiers={[
                        font({ size: 32 }),
                        padding({ bottom: 4 }),
                    ]}
                >
                    🛒
                </Text>
                <Text
                    modifiers={[
                        font({ weight: 'bold', size: 20 }),
                    ]}
                >
                    {formattedTotal}
                </Text>
                <Text
                    modifiers={[
                        font({ size: 12 }),
                        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                    ]}
                >
                    {itemLabel}
                </Text>
            </VStack>
        );
    }

    // ── Medium: header + first 2 items ───────────────────────────────────────
    if (family === 'systemMedium') {
        return (
            <HStack
                modifiers={[
                    frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' }),
                    padding({ all: 12 }),
                ]}
            >
                {/* Left: summary */}
                <VStack modifiers={[frame({ width: 100 }), padding({ trailing: 8 })]}>
                    <Text modifiers={[font({ size: 28 })]}>🛒</Text>
                    <Text
                        modifiers={[
                            font({ weight: 'bold', size: 16 }),
                            padding({ top: 4 }),
                        ]}
                    >
                        {formattedTotal}
                    </Text>
                    <Text
                        modifiers={[
                            font({ size: 11 }),
                            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                        ]}
                    >
                        {itemLabel}
                    </Text>
                </VStack>

                {/* Right: first 2 items */}
                <VStack>
                    {items.slice(0, 2).map((item, i) => (
                        <HStack key={i} modifiers={[padding({ bottom: 6 })]}>
                            <VStack modifiers={[frame({ maxWidth: 999 })]}>
                                <Text
                                    modifiers={[
                                        font({ weight: 'medium', size: 12 }),
                                    ]}
                                >
                                    {item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name}
                                </Text>
                                <Text
                                    modifiers={[
                                        font({ size: 11 }),
                                        foregroundStyle({ type: 'hierarchical', style: 'tertiary' }),
                                    ]}
                                >
                                    {currency} {item.price.toFixed(2)}
                                </Text>
                            </VStack>
                        </HStack>
                    ))}
                    {itemCount > 2 && (
                        <Text
                            modifiers={[
                                font({ size: 11 }),
                                foregroundStyle({ type: 'hierarchical', style: 'quaternary' }),
                            ]}
                        >
                            +{itemCount - 2} more
                        </Text>
                    )}
                </VStack>
            </HStack>
        );
    }

    // ── Large & ExtraLarge: full list ─────────────────────────────────────────
    if (family === 'systemLarge' || family === 'systemExtraLarge') {
        return (
            <VStack
                modifiers={[
                    frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'top' }),
                    padding({ all: 16 }),
                ]}
            >
                {/* Header */}
                <HStack modifiers={[padding({ bottom: 12 })]}>
                    <Text
                        modifiers={[
                            font({ weight: 'bold', size: 18 }),
                            frame({ maxWidth: 999 }),
                        ]}
                    >
                        🛒 Shopping Cart
                    </Text>
                    <Text
                        modifiers={[
                            font({ size: 12 }),
                            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                        ]}
                    >
                        {itemLabel}
                    </Text>
                </HStack>

                {/* Item list */}
                {items.slice(0, 5).map((item, i) => (
                    <HStack key={i} modifiers={[padding({ bottom: 8 })]}>
                        <Text
                            modifiers={[
                                font({ size: 13 }),
                                frame({ maxWidth: 999 }),
                            ]}
                        >
                            {item.name.length > 22 ? item.name.slice(0, 22) + '…' : item.name}
                        </Text>
                        <Text
                            modifiers={[
                                font({ weight: 'semibold', size: 13 }),
                            ]}
                        >
                            {currency} {item.price.toFixed(2)}
                        </Text>
                    </HStack>
                ))}

                {/* Total */}
                <HStack modifiers={[padding({ top: 8 })]}>
                    <Text
                        modifiers={[
                            font({ size: 14 }),
                            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                            frame({ maxWidth: 999 }),
                        ]}
                    >
                        Total
                    </Text>
                    <Text
                        modifiers={[
                            font({ weight: 'bold', size: 18 }),
                        ]}
                    >
                        {formattedTotal}
                    </Text>
                </HStack>
            </VStack>
        );
    }

    // ── Lock Screen / Accessories ─────────────────────────────────────────────
    return (
        <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                🛒 {itemCount}
            </Text>
        </HStack>
    );
};

// ─── Export ───────────────────────────────────────────────────────────────────

const CartWidget = createWidget('CartWidget', CartHomeWidget);
export default CartWidget;

// Seed with empty state so the widget shows something immediately on first add
CartWidget.updateSnapshot({
    itemCount: 0,
    totalAmount: 0,
    currency: 'TND',
    items: [],
});

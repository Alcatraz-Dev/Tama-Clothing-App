import { VStack, HStack, Text, Spacer, Image, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow, opacity } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetBase } from 'expo-widgets';

const CartHomeWidget = (props: WidgetBase<any>) => {
    'widget';
    const {
        family,
        itemCount = 0,
        totalAmount = 0,
        currency = 'TND',
        items = [],
        isDark = true
    } = props || {};

    const BEY3A_ACCENT = '#8A2BE2';
    const bgColor = isDark ? '#1c1c1e' : '#f5f5f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryColor = isDark ? '#ffffff' : '#1c1c1e';
    const secondaryColor = isDark ? '#8E8E93' : '#636366';
    const secondaryStyle = foregroundStyle(secondaryColor);
    const accentStyle = foregroundStyle(BEY3A_ACCENT);

    // ── Small ─────────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const firstItem = items.length > 0 ? items[0] : null;
        return (
            <VStack modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
                background(bgColor)
            ]}>
                <VStack modifiers={[
                    frame({ maxWidth: 9999, height: 80, alignment: 'center' }),
                    background(cardBgColor)
                ]}>
                    <Image systemName="cart.fill" modifiers={[font({ size: 32 }), foregroundStyle(BEY3A_ACCENT)]} />
                </VStack>

                <VStack modifiers={[
                    padding({ horizontal: 10, vertical: 8 }),
                    frame({ maxWidth: 9999, alignment: 'leading' })
                ]}>
                    <Text modifiers={[font({ size: 11, weight: 'black' }), secondaryStyle]}>PANIER</Text>
                    <Text modifiers={[font({ size: 16, weight: 'black' }), accentStyle, padding({ top: 2 })]}>
                        {totalAmount || 0} {currency}
                    </Text>
                    <Text modifiers={[font({ size: 11 }), secondaryStyle]}>{itemCount} articles</Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium ────────────────────────────────────────────────────────────────
    if (family === 'systemMedium') {
        const showItems = items.slice(0, 3);
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
                    <HStack>
                        <Image systemName="cart.fill.badge.plus" modifiers={[font({ size: 18 }), foregroundStyle(BEY3A_ACCENT)]} />
                        <VStack alignment="leading" modifiers={[padding({ leading: 8 })]}>
                            <Text modifiers={[font({ size: 14, weight: 'black' }), foregroundStyle(primaryColor)]}>
                                Mon Panier
                            </Text>
                            <Text modifiers={[font({ size: 11 }), secondaryStyle]}>
                                {itemCount} article{itemCount !== 1 ? 's' : ''}
                            </Text>
                        </VStack>
                    </HStack>
                    <Spacer />
                    <VStack alignment="trailing">
                        <Text modifiers={[font({ size: 10 }), secondaryStyle]}>TOTAL</Text>
                        <Text modifiers={[font({ size: 18, weight: 'black' }), accentStyle]}>
                            {totalAmount.toFixed(0)} {currency}
                        </Text>
                    </VStack>
                </HStack>

                <HStack modifiers={[
                    padding({ horizontal: 12, vertical: 10 }),
                    frame({ maxWidth: 9999, alignment: 'leading' })
                ]}>
                    {showItems.length === 0 ? (
                        <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'center' })]}>
                            <Text modifiers={[font({ size: 12 }), secondaryStyle]}>
                                Votre panier est vide
                            </Text>
                        </VStack>
                    ) : (
                        showItems.map((item: any, i: number) => (
                            <HStack key={i} modifiers={[padding({ trailing: 10 })]}>
                                <VStack modifiers={[
                                    frame({ width: 52, height: 52, alignment: 'center' }),
                                    cornerRadius(10),
                                    background(cardBgColor)
                                ]}>
                                    <Image systemName="bag.fill" modifiers={[font({ size: 22 }), foregroundStyle(BEY3A_ACCENT)]} />
                                </VStack>
                            </HStack>
                        ))
                    )}
                </HStack>
            </VStack>
        );
    }

    // ── Large Default ─────────────────────────────────────────────────────────
    return (
        <VStack modifiers={[
            frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }),
            background(bgColor)
        ]}>
            <HStack modifiers={[
                padding({ horizontal: 16, vertical: 14 }),
                frame({ maxWidth: 9999 }),
                background(cardBgColor)
            ]}>
                <VStack alignment="leading">
                    <Text modifiers={[font({ size: 18, weight: 'black' }), foregroundStyle(primaryColor)]}>
                        Panier d'achat
                    </Text>
                    <Text modifiers={[font({ size: 12 }), secondaryStyle]}>
                        {itemCount} article{itemCount !== 1 ? 's' : ''} · BEY3A
                    </Text>
                </VStack>
                <Spacer />
                <Image systemName="cart.fill" modifiers={[font({ size: 26 }), foregroundStyle(BEY3A_ACCENT)]} />
            </HStack>

            <VStack modifiers={[
                padding({ horizontal: 14, vertical: 10 }),
                frame({ maxWidth: 9999, alignment: 'leading' })
            ]}>
                {items.slice(0, 4).map((item: any, i: number) => (
                    <HStack key={i} modifiers={[padding({ vertical: 6 })]}>
                        <VStack modifiers={[
                            frame({ width: 40, height: 40, alignment: 'center' }),
                            cornerRadius(8),
                            background(cardBgColor)
                        ]}>
                            <Image systemName="cart.fill" modifiers={[font({ size: 18 }), foregroundStyle(BEY3A_ACCENT)]} />
                        </VStack>
                        <VStack alignment="leading" modifiers={[padding({ leading: 10 })]}>
                            <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(primaryColor)]}>{item.name}</Text>
                            <Text modifiers={[font({ size: 12, weight: 'bold' }), accentStyle]}>{item.price} {currency}</Text>
                        </VStack>
                    </HStack>
                ))}
            </VStack>
        </VStack>
    );
};

export default createWidget('CartWidget', CartHomeWidget);

import { VStack, HStack, Text, Spacer, Image, ScrollView } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius, background, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetBase } from 'expo-widgets';

const RecommendationsWidgetView = (props: WidgetBase<any>) => {
    'widget';
    const {
        family,
        products = [],
        isDark = true
    } = props || {};

    const BEY3A_ACCENT = '#8A2BE2';
    const bgColor = { dynamic: { light: '#f2f2f7', dark: '#1c1c1e' } } as any;
    const cardBgColor = { dynamic: { light: '#ffffff', dark: '#2c2c2e' } } as any;
    const primaryColor = { dynamic: { light: '#1c1c1e', dark: '#ffffff' } } as any;
    const secondaryColor = '#8E8E93';

    if (family === 'systemSmall') {
        const product = products[0];
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), background(bgColor)]}>
                <VStack modifiers={[frame({ maxWidth: 9999, height: 90, alignment: 'center' }), background(BEY3A_ACCENT + '20')]}>
                    <Image systemName="sparkles" modifiers={[font({ size: 30 }), foregroundStyle(BEY3A_ACCENT)]} />
                </VStack>
                <VStack modifiers={[padding({ horizontal: 10, vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                    <Text modifiers={[font({ size: 10, weight: 'black' }), foregroundStyle(secondaryColor)]}>POUR VOUS</Text>
                    <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(primaryColor)]}>
                        {product?.name || 'Découvrir'}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), background(bgColor)]}>
            <HStack modifiers={[padding({ horizontal: 14, vertical: 10 }), frame({ maxWidth: 9999 }), background(cardBgColor)]}>
                <Image systemName="sparkles" modifiers={[font({ size: 16 }), foregroundStyle(BEY3A_ACCENT)]} />
                <Text modifiers={[font({ size: 14, weight: 'black' }), foregroundStyle(primaryColor), padding({ leading: 6 })]}>
                    Recommandé
                </Text>
            </HStack>

            <HStack modifiers={[padding({ horizontal: 10, vertical: 10 }), frame({ maxWidth: 9999 })]}>
                {products.slice(0, 3).map((item: any, i: number) => (
                    <VStack key={i} modifiers={[padding({ horizontal: 4 }), frame({ minWidth: 60, maxWidth: 120 })]}>
                        <VStack modifiers={[
                            frame({ height: 80, alignment: 'center' }),
                            cornerRadius(10),
                            background(cardBgColor)
                        ]}>
                            <Image systemName="star.fill" modifiers={[font({ size: 24 }), foregroundStyle(BEY3A_ACCENT)]} />
                        </VStack>
                        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(primaryColor), padding({ top: 4 })]}>
                            {item.name?.slice(0, 15)}
                        </Text>
                    </VStack>
                ))}
            </HStack>
        </VStack>
    );
};

export default createWidget('RecommendationsWidget', RecommendationsWidgetView);

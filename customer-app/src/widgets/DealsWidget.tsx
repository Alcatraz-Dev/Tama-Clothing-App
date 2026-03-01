import { VStack, HStack, Text, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, cornerRadius } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

export type Deal = {
    title: string;
    description: string;
    salePrice: number;
    originalPrice: number;
    id: string;
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
        currency = 'USD'
    } = props;

    const secondaryStyle = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    const redColor = foregroundStyle({ type: 'color', color: '#FF453A' });

    // ── Accessories (Lock Screen / Notch) ─────────────────────────────────────────
    if (family === 'accessoryInline') {
        const firstDeal = activeDeals.length > 0 ? activeDeals[0] : null;
        return (
            <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                🔥 {firstDeal ? firstDeal.title : 'No Deals'}
            </Text>
        );
    }

    if (family === 'accessoryRectangular') {
        const firstDeal = activeDeals.length > 0 ? activeDeals[0] : null;
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 20 })]}>🔥</Text>
                <VStack modifiers={[padding({ leading: 8 }), frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 14 })]}>
                        {firstDeal ? firstDeal.title : 'No Deals'}
                    </Text>
                    {firstDeal && (
                        <Text modifiers={[font({ size: 12 }), secondaryStyle]}>
                            {currency}{firstDeal.salePrice}
                        </Text>
                    )}
                </VStack>
            </HStack>
        );
    }

    if (family === 'accessoryCircular') {
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ size: 24 })]}>🔥</Text>
            </VStack>
        );
    }

    // ── Small Widget ─────────────────────────────────────────────────────────────
    if (family === 'systemSmall') {
        const count = activeDeals.length;
        return (
            <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'leading' }), padding({ all: 16 })]}>
                <Text modifiers={[font({ size: 28 })]}>🔥</Text>
                <Spacer />
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 18 })]}>Deals</Text>
                    <Text modifiers={[font({ weight: 'bold', size: 22 }), redColor]}>
                        {count > 0 ? `${count} Active` : 'None'}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    // ── Medium & Large Widget ────────────────────────────────────────────────────
    const showCount = family === 'systemLarge' ? 5 : 2;

    return (
        <VStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: 16 })]}>
            <HStack modifiers={[padding({ bottom: 12 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                <VStack modifiers={[frame({ alignment: 'leading' })]}>
                    <Text modifiers={[font({ weight: 'bold', size: 20 })]}>Daily Deals</Text>
                    <Text modifiers={[font({ size: 13 }), secondaryStyle]}>Exclusive offers for you</Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 28 })]}>🔥</Text>
            </HStack>

            <VStack modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
                {activeDeals.length === 0 ? (
                    <VStack modifiers={[frame({ maxWidth: 9999, minHeight: 80, alignment: 'center' })]}>
                        <Text modifiers={[font({ size: 14 }), secondaryStyle]}>Check back later for deals</Text>
                    </VStack>
                ) : (
                    activeDeals.slice(0, showCount).map((deal: any, i: number) => (
                        <HStack key={i} modifiers={[padding({ vertical: 8 }), frame({ maxWidth: 9999, alignment: 'leading' })]}>
                            <VStack modifiers={[frame({ alignment: 'leading' })]}>
                                <Text modifiers={[font({ weight: 'semibold', size: 15 })]}>
                                    {deal.title.length > 25 ? deal.title.slice(0, 25) + '…' : deal.title}
                                </Text>
                                <HStack modifiers={[frame({ alignment: 'leading' })]}>
                                    <Text modifiers={[font({ weight: 'bold', size: 14 }), redColor]}>
                                        {currency}{deal.salePrice.toFixed(2)}
                                    </Text>
                                    <Text modifiers={[font({ size: 12 }), secondaryStyle, padding({ leading: 8 })]}>
                                        {currency}{deal.originalPrice.toFixed(2)}
                                    </Text>
                                </HStack>
                            </VStack>
                        </HStack>
                    ))
                )}
            </VStack>
        </VStack>
    );
};

const DealsWidget = createWidget('DealsWidget', DealsWidgetComponent);
export default DealsWidget;

DealsWidget.updateSnapshot({
    activeDeals: [
        { id: '1', title: 'Summer Collection Sale', description: '50% Off', salePrice: 45.00, originalPrice: 90.00 },
        { id: '2', title: 'Flash Deal: Sneakers', description: 'Limited Time', salePrice: 20.00, originalPrice: 40.00 }
    ],
    currency: 'USD'
});

import { VStack, HStack, Text } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

const DealsWidgetComponent = (props: WidgetBase<any>) => {
    'widget';
    const { family } = props;

    // Lock Screen accessories: compact inline text only
    if (family === 'accessoryRectangular' || family === 'accessoryInline' || family === 'accessoryCircular') {
        return (
            <HStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' })]}>
                <Text modifiers={[font({ weight: 'bold', size: 14 })]}>🔥 Deals</Text>
            </HStack>
        );
    }

    // Small / Medium / Large: icon + title + subtitle
    return (
        <VStack
            modifiers={[
                frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'center' }),
                padding({ all: 16 }),
            ]}
        >
            <Text modifiers={[font({ size: 32 }), padding({ bottom: 8 })]}>🔥</Text>
            <Text modifiers={[font({ weight: 'bold', size: 16 })]}>
                Daily Deals
            </Text>
            <Text modifiers={[
                font({ size: 12 }),
                foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                padding({ top: 4 }),
            ]}>
                Check back for today's deals
            </Text>
        </VStack>
    );
};

const DealsWidget = createWidget('DealsWidget', DealsWidgetComponent);
export default DealsWidget;

DealsWidget.updateSnapshot({});

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const RecommendationsWidget = ({ recCount = 0 }: any) => {
    const count = recCount;
    return (
        <FlexWidget
            style={{
                width: 'match_parent',
                height: 'match_parent',
                backgroundColor: '#000000',
                padding: 16,
                borderRadius: 24,
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
                <TextWidget
                    text="✨"
                    style={{ fontSize: 24 }}
                />
            </FlexWidget>

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TextWidget
                    text="For You"
                    style={{ color: '#8E8E93', fontSize: 13 }}
                />
                <TextWidget
                    text={count > 0 ? `${count} Items` : 'Discover'}
                    style={{ color: '#AF52DE', fontSize: 22, fontWeight: 'bold' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
};

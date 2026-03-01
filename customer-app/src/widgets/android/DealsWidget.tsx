import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const DealsWidget = ({ dealsCount = 0 }: any) => {
    const count = dealsCount;
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
                    text="🔥"
                    style={{ fontSize: 24 }}
                />
            </FlexWidget>

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TextWidget
                    text="Daily Deals"
                    style={{ color: '#8E8E93', fontSize: 13 }}
                />
                <TextWidget
                    text={count > 0 ? `${count} Active` : 'None'}
                    style={{ color: '#FF453A', fontSize: 22, fontWeight: 'bold' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
};

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const OrderTrackingWidget = ({ orderIdString = '', statusString = '', estimatedDelivery = '' }: any) => {
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
                    text="📦"
                    style={{ fontSize: 24 }}
                />
            </FlexWidget>

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TextWidget
                    text={orderIdString ? `#${orderIdString}` : 'Tracking'}
                    style={{ color: '#8E8E93', fontSize: 13 }}
                />
                <TextWidget
                    text={statusString || 'Ready'}
                    style={{ color: '#0A84FF', fontSize: 20, fontWeight: 'bold' }}
                />
                {estimatedDelivery && (
                    <TextWidget
                        text={estimatedDelivery}
                        style={{ color: '#ffffff', fontSize: 12, marginTop: 4 }}
                    />
                )}
            </FlexWidget>
        </FlexWidget>
    );
};

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const CartWidget = ({ itemCountValue = 0, totalAmountValue = 0, currencyCode = 'USD' }: any) => {
    return (
        <FlexWidget
            style={{
                width: 'match_parent',
                height: 'match_parent',
                backgroundColor: '#000000',
                padding: 16,
                borderRadius: 24,
                flexDirection: 'column',
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
                <TextWidget
                    text="🛒"
                    style={{ fontSize: 24 }}
                />
                <FlexWidget style={{ backgroundColor: '#0A84FF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <TextWidget
                        text={`${itemCountValue}`}
                        style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
                    />
                </FlexWidget>
            </FlexWidget>

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TextWidget
                    text="Cart"
                    style={{ color: '#8E8E93', fontSize: 14 }}
                />
                <TextWidget
                    text={`${currencyCode}${totalAmountValue.toFixed(0)}`}
                    style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
};

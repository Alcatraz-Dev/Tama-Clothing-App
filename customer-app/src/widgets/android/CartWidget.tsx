import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const CartWidget = ({
    itemCountValue = 0,
    totalAmountValue = 0,
    currencyCode = 'TND',
    size = 'MEDIUM'
}: any) => {
    const isLarge = size === 'LARGE';
    const isSmall = size === 'SMALL';

    if (isSmall) {
        return (
            <FlexWidget
                style={{
                    width: 'match_parent',
                    height: 'match_parent',
                    backgroundColor: '#1C1C1E',
                    padding: 8,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <FlexWidget
                    style={{
                        backgroundColor: '#2C2C2E',
                        borderRadius: 12,
                        width: 44,
                        height: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 4
                    }}
                >
                    <TextWidget
                        text="🛒"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={`${itemCountValue}`}
                    style={{ color: '#0A84FF', fontSize: 16, fontWeight: 'bold' }}
                />
            </FlexWidget>
        );
    }

    return (
        <FlexWidget
            style={{
                width: 'match_parent',
                height: 'match_parent',
                backgroundColor: '#1C1C1E',
                padding: 10,
                borderRadius: 28,
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                    marginBottom: isLarge ? 2 : 6
                }}
            >
                <FlexWidget
                    style={{
                        backgroundColor: '#2C2C2E',
                        borderRadius: 12,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <TextWidget
                        text="🛒"
                        style={{ fontSize: 20 }}
                    />
                </FlexWidget>

                <FlexWidget
                    style={{
                        backgroundColor: '#0A84FF',
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                    }}
                >
                    <TextWidget
                        text={itemCountValue > 0 ? `${itemCountValue} Articles` : 'Panier Vide'}
                        style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {isLarge && (
                <FlexWidget style={{ marginVertical: 8 }}>
                    <TextWidget
                        text="Résumé de votre commande"
                        style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Consultez votre panier pour plus de détails."
                        style={{ color: '#8E8E93', fontSize: 12 }}
                    />
                </FlexWidget>
            )}

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                <TextWidget
                    text="Total Panier"
                    style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600', marginBottom: 1 }}
                />
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextWidget
                        text={totalAmountValue > 0 ? `${totalAmountValue.toFixed(2)}` : '0.00'}
                        style={{ color: '#ffffff', fontSize: isLarge ? 32 : 24, fontWeight: 'bold' }}
                    />
                    <TextWidget
                        text={` ${currencyCode}`}
                        style={{ color: '#0A84FF', fontSize: isLarge ? 18 : 14, fontWeight: 'bold', marginLeft: 4 }}
                    />
                </FlexWidget>
            </FlexWidget>
        </FlexWidget>
    );
};

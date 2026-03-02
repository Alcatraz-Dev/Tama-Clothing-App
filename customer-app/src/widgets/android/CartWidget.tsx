import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const CartWidget = ({
    itemCountValue = 0,
    totalAmountValue = 0,
    currencyCode = 'TND',
    size = 'MEDIUM',
    isDark = true
}: any) => {
    const isLarge = size === 'LARGE';
    const isSmall = size === 'SMALL';

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';
    const accentColor = '#0A84FF';

    if (isSmall) {
        return (
            <FlexWidget
                style={{
                    width: 'match_parent',
                    height: 'match_parent',
                    backgroundColor: bgColor,
                    padding: 8,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <FlexWidget
                    style={{
                        backgroundColor: cardBgColor,
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
                    style={{ color: accentColor, fontSize: 16, fontWeight: 'bold' }}
                />
            </FlexWidget>
        );
    }

    return (
        <FlexWidget
            style={{
                width: 'match_parent',
                height: 'match_parent',
                backgroundColor: bgColor,
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
                        backgroundColor: cardBgColor,
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
                        backgroundColor: accentColor,
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
                        style={{ color: primaryTextColor, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Consultez votre panier pour plus de détails."
                        style={{ color: secondaryTextColor, fontSize: 12 }}
                    />
                </FlexWidget>
            )}

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                <TextWidget
                    text="Total Panier"
                    style={{ color: secondaryTextColor, fontSize: 11, fontWeight: '600', marginBottom: 1 }}
                />
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextWidget
                        text={totalAmountValue > 0 ? `${totalAmountValue.toFixed(2)}` : '0.00'}
                        style={{ color: primaryTextColor, fontSize: isLarge ? 32 : 24, fontWeight: 'bold' }}
                    />
                    <TextWidget
                        text={` ${currencyCode}`}
                        style={{ color: accentColor, fontSize: isLarge ? 18 : 14, fontWeight: 'bold', marginLeft: 4 }}
                    />
                </FlexWidget>
            </FlexWidget>
        </FlexWidget>
    );
};

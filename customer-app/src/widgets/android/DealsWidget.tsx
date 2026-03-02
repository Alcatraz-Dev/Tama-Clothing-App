import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const DealsWidget = ({ dealsCount = 0, size = 'MEDIUM' }: any) => {
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
                        text="🔥"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={`${dealsCount}`}
                    style={{ color: '#FF453A', fontSize: 16, fontWeight: 'bold' }}
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
                padding: 12,
                borderRadius: 28,
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                    marginBottom: isLarge ? 4 : 8
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
                        text="🔥"
                        style={{ fontSize: 20 }}
                    />
                </FlexWidget>

                <FlexWidget
                    style={{
                        backgroundColor: '#FF3B30',
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                    }}
                >
                    <TextWidget
                        text="HOT"
                        style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {isLarge && (
                <FlexWidget style={{ marginVertical: 8 }}>
                    <TextWidget
                        text="Flash Sales & Discounts"
                        style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Économisez plus sur vos marques préférées aujourd'hui."
                        style={{ color: '#8E8E93', fontSize: 12 }}
                    />
                </FlexWidget>
            )}

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 4 }}>
                <TextWidget
                    text="Offres du Jour"
                    style={{ color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 2 }}
                />
                <TextWidget
                    text={dealsCount > 0 ? `${dealsCount} Offres Actives` : 'Vérifier maintenant'}
                    style={{ color: '#FF453A', fontSize: isLarge ? 28 : 22, fontWeight: 'bold' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
};

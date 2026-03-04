import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';

export const RecommendationsWidget = ({ products = [], size = 'MEDIUM', isDark = true }: any) => {
    const isLarge = size === 'LARGE';
    const isSmall = size === 'SMALL';
    const currency = 'TND';

    const bgColor = isDark ? '#1c1c1e' : '#f2f2f7';
    const cardBgColor = isDark ? '#2c2c2e' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#8e8e93' : '#3c3c43';
    const accentColor = '#AF52DE';

    if (isSmall) {
        const count = products.length;
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
                        text="✨"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={count > 0 ? `${count}` : 'Voir'}
                    style={{ color: accentColor, fontSize: 13, fontWeight: 'bold' }}
                />
            </FlexWidget>
        );
    }

    const showCount = isLarge ? 3 : 2;

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
                    marginBottom: 8
                }}
            >
                <FlexWidget
                    style={{
                        backgroundColor: cardBgColor,
                        borderRadius: 8,
                        width: 28,
                        height: 28,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <TextWidget
                        text="✨"
                        style={{ fontSize: 13 }}
                    />
                </FlexWidget>

                <FlexWidget
                    style={{
                        backgroundColor: '#AF52DE',
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                    }}
                >
                    <TextWidget
                        text="BEY3A REC"
                        style={{ color: '#ffffff', fontSize: 8, fontWeight: '900' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {products.length === 0 ? (
                <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <TextWidget
                        text="Aucune recommendation"
                        style={{ color: secondaryTextColor, fontSize: 13 }}
                    />
                </FlexWidget>
            ) : (
                <FlexWidget style={{ flex: 1 }}>
                    {products.slice(0, showCount).map((item: any, index: number) => (
                        <FlexWidget
                            key={index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 7,
                                width: 'match_parent'
                            }}
                        >
                            <FlexWidget
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 6,
                                    backgroundColor: cardBgColor,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden'
                                }}
                            >
                                {item.imageUrl ? (
                                    <ImageWidget
                                        image={item.imageUrl}
                                        style={{ width: 34, height: 34 }}
                                        imageWidth={34}
                                        imageHeight={34}
                                    />
                                ) : (
                                    <TextWidget text="👕" style={{ fontSize: 16 }} />
                                )}
                            </FlexWidget>

                            <FlexWidget style={{ marginLeft: 8, flex: 1 }}>
                                <TextWidget
                                    text={item.name}
                                    style={{ color: primaryTextColor, fontSize: 12, fontWeight: 'bold' }}
                                    maxLines={1}
                                />
                                <TextWidget
                                    text={`${item.price.toFixed(0)} ${currency}`}
                                    style={{ color: accentColor, fontSize: 11, fontWeight: 'bold' }}
                                />
                            </FlexWidget>
                        </FlexWidget>
                    ))}
                </FlexWidget>
            )}

            {!isLarge && (
                <FlexWidget style={{ marginTop: 0 }}>
                    <TextWidget
                        text="Basé sur votre style"
                        style={{ color: secondaryTextColor, fontSize: 9 }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
};

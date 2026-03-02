import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';

export const RecommendationsWidget = ({ products = [], size = 'MEDIUM' }: any) => {
    const isLarge = size === 'LARGE';
    const isSmall = size === 'SMALL';
    const currency = 'TND';

    if (isSmall) {
        const count = products.length;
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
                        text="✨"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={`${count}`}
                    style={{ color: '#AF52DE', fontSize: 16, fontWeight: 'bold' }}
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
                    marginBottom: 8
                }}
            >
                <FlexWidget
                    style={{
                        backgroundColor: '#2C2C2E',
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
                        text="FOR YOU"
                        style={{ color: '#ffffff', fontSize: 8, fontWeight: '900' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {products.length === 0 ? (
                <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <TextWidget
                        text="Aucune recommendation"
                        style={{ color: '#8E8E93', fontSize: 13 }}
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
                                    width: 36,
                                    height: 36,
                                    borderRadius: 6,
                                    backgroundColor: '#2C2C2E',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden'
                                }}
                            >
                                {item.imageUrl ? (
                                    <ImageWidget
                                        image={item.imageUrl}
                                        style={{ width: 36, height: 36 }}
                                        imageWidth={36}
                                        imageHeight={36}
                                    />
                                ) : (
                                    <TextWidget text="👕" style={{ fontSize: 16 }} />
                                )}
                            </FlexWidget>

                            <FlexWidget style={{ marginLeft: 8, flex: 1 }}>
                                <TextWidget
                                    text={item.name}
                                    style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
                                    maxLines={1}
                                />
                                <TextWidget
                                    text={`${item.price.toFixed(0)} ${currency}`}
                                    style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}
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
                        style={{ color: '#8E8E93', fontSize: 9 }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
};

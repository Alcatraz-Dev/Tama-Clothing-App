import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const OrderTrackingWidget = ({
    orderIdString = '',
    statusString = '',
    estimatedDelivery = '',
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
                        text="🚚"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={statusString ? (statusString.length > 8 ? statusString.slice(0, 8) + '..' : statusString) : '...'}
                    style={{ color: '#34C759', fontSize: 13, fontWeight: 'bold' }}
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
                        text="🚚"
                        style={{ fontSize: 20 }}
                    />
                </FlexWidget>

                <FlexWidget
                    style={{
                        backgroundColor: '#34C759',
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                    }}
                >
                    <TextWidget
                        text="LIVE"
                        style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {isLarge && (
                <FlexWidget style={{ marginVertical: 8 }}>
                    <TextWidget
                        text="Dernière étape franchie"
                        style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Votre colis est en cours de traitement par notre équipe logistique."
                        style={{ color: '#8E8E93', fontSize: 12 }}
                    />
                </FlexWidget>
            )}

            <FlexWidget style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                <TextWidget
                    text={orderIdString ? `#${orderIdString.toUpperCase().slice(0, 8)}` : 'Suivi de Commande'}
                    style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600', marginBottom: 1 }}
                />
                <TextWidget
                    text={statusString || 'Réception...'}
                    style={{ color: '#0A84FF', fontSize: isLarge ? 28 : 20, fontWeight: 'bold' }}
                />
                {(isLarge || estimatedDelivery) && (
                    <TextWidget
                        text={estimatedDelivery ? `Date prévue: ${estimatedDelivery}` : 'Traitement en cours'}
                        style={{ color: '#ffffff', fontSize: 12, marginTop: 4, fontWeight: '500' }}
                    />
                )}
            </FlexWidget>
        </FlexWidget>
    );
};

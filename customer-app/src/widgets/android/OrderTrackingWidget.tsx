import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

/**
 * Modern, Premium Order Tracking Widget for Android.
 * Features a visual progress bar, glassmorphism-inspired cards (simulated), 
 * and vibrant brand colors.
 */
export const OrderTrackingWidget = ({
    orderIdString = '',
    statusString = '',
    progress = 0, // 0 to 1
    estimatedDelivery = '',
    size = 'MEDIUM',
    isDark = true
}: any) => {
    const isLarge = size === 'LARGE';
    const isSmall = size === 'SMALL';

    // Premium Dark Theme Palette
    const bgColor = isDark ? '#121212' : '#f2f2f7';
    const cardBgColor = isDark ? '#1E1E1E' : '#ffffff';
    const primaryTextColor = isDark ? '#ffffff' : '#000000';
    const secondaryTextColor = isDark ? '#B0B0B0' : '#3c3c43';
    const accentColor = '#0A84FF'; // Dynamic Blue
    const successColor = '#34C759'; // Success Green

    // Helper to format time from timestamp
    const formatTime = (ts: any) => {
        if (!ts) return '';
        try {
            const date = new Date(Number(ts));
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            return '';
        }
    };

    const displayEta = estimatedDelivery ? formatTime(estimatedDelivery) : '';

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
                        backgroundColor: cardBgColor as any,
                        borderRadius: 16,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 6
                    }}
                >
                    <TextWidget
                        text="🛵"
                        style={{ fontSize: 24 }}
                    />
                </FlexWidget>
                <TextWidget
                    text={statusString ? (statusString.length > 8 ? statusString.slice(0, 8) + '..' : statusString) : '...'}
                    style={{ color: accentColor, fontSize: 12, fontWeight: 'bold' }}
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
                padding: 12,
                borderRadius: 28,
            }}
        >
            {/* Header: Icon + Badge */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                    marginBottom: 10
                }}
            >
                <FlexWidget
                    style={{
                        borderRadius: 14,
                        width: 44,
                        height: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: cardBgColor as any
                    }}
                >
                    <TextWidget
                        text="🛵"
                        style={{ fontSize: 22 }}
                    />
                </FlexWidget>

                <FlexWidget
                    style={{
                        backgroundColor: `${successColor}20` as any, // Subtle tint
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: `${successColor}40` as any
                    }}
                >
                    <TextWidget
                        text="EN DIRECT"
                        style={{ color: successColor, fontSize: 10, fontWeight: '900' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Content Section */}
            <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
                <TextWidget
                    text={orderIdString ? `COMMANDE #${orderIdString.toUpperCase().slice(0, 8)}` : 'SUIVI DE COMMANDE'}
                    style={{ color: secondaryTextColor, fontSize: 10, fontWeight: '800', marginBottom: 2, letterSpacing: 0.5 }}
                />
                <TextWidget
                    text={statusString || 'Traitement...'}
                    style={{ color: primaryTextColor, fontSize: isLarge ? 26 : 20, fontWeight: 'bold' }}
                />

                {/* Visual Progress Bar (The "Dynamic Island" feel on Android) */}
                <FlexWidget
                    style={{
                        flexDirection: 'row',
                        width: 'match_parent',
                        height: 6,
                        backgroundColor: (isDark ? '#333333' : '#E0E0E0') as any,
                        borderRadius: 3,
                        marginTop: 10,
                    }}
                >
                    <FlexWidget
                        style={{
                            flex: progress || 0.1,
                            height: 6,
                            backgroundColor: accentColor as any,
                            borderRadius: 3,
                        }}
                    />
                    <FlexWidget
                        style={{
                            flex: 1 - (progress || 0.1),
                        }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Footer: ETA Info */}
            <FlexWidget
                style={{
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <TextWidget
                    text={displayEta ? `Arrivée à ${displayEta}` : 'Livraison prévue'}
                    style={{ color: secondaryTextColor, fontSize: 11, fontWeight: '500' }}
                />
                {isLarge && (
                    <TextWidget
                        text="Bey3a"
                        style={{ color: accentColor, fontSize: 11, fontWeight: 'bold' }}
                    />
                )}
            </FlexWidget>
        </FlexWidget>
    );
};

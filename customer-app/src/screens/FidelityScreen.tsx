import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Animated } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft } from 'lucide-react-native';
import FidelityCard from '../components/FidelityCard';
import { Gift, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface FidelityScreenProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    user: any;
    t: any;
    theme: string;
}

export default function FidelityScreen({ onBack, onNavigate, user, t, theme }: FidelityScreenProps) {
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [ordersCount, setOrdersCount] = useState(0);
    const [activeCardIndex, setActiveCardIndex] = useState(0);

    const tr = (key: string, fallback: string) => {
        const res = t(key);
        return res === key ? fallback : res;
    };

    const themeColor = isDark ? '#FFF' : '#000';
    const bgColor = isDark ? '#000' : '#FFF';

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPoints = async () => {
            try {
                const q = query(
                    collection(db, 'orders'),
                    where('customer.uid', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                let deliveredCount = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status?.toLowerCase() === 'delivered') {
                        deliveredCount++;
                    }
                });
                setOrdersCount(deliveredCount);
            } catch (err) {
                console.error('Error fetching fidelity points', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPoints();
    }, [user]);

    // Calculate completed cards and current active card based on completed orders
    const completedCardsCount = Math.floor(ordersCount / 10);
    const activePoints = ordersCount % 10;

    const cards = [];
    for (let i = 0; i < 10; i++) {
        if (i < completedCardsCount) {
            cards.push({ id: `card_${i}`, points: 10, isCompleted: true, index: i + 1, status: 'completed' });
        } else if (i === completedCardsCount) {
            cards.push({ id: `card_${i}`, points: activePoints, isCompleted: false, index: i + 1, status: 'active' });
        } else {
            cards.push({ id: `card_${i}`, points: 0, isCompleted: false, index: i + 1, status: 'locked' });
        }
    }

    // --- VIP Tiers Logic ---
    const getVipTier = (count: number) => {
        if (count >= 50) return { id: 'platinum', name: 'Platinum', icon: '👑', color: ['#E5E4E2', '#B4B4B4'] as [string, string], next: null as null, min: 50 };
        if (count >= 30) return { id: 'gold', name: 'Gold', icon: '✨', color: ['#FFDF00', '#D4AF37'] as [string, string], next: { min: 50, name: 'Platinum' } as { min: number; name: string } | null, min: 30 };
        if (count >= 10) return { id: 'silver', name: 'Silver', icon: '💎', color: ['#C0C0C0', '#808080'] as [string, string], next: { min: 30, name: 'Gold' } as { min: number; name: string } | null, min: 10 };
        return { id: 'bronze', name: 'Bronze', icon: '🛡️', color: ['#CD7F32', '#8B4513'] as [string, string], next: { min: 10, name: 'Silver' } as { min: number; name: string } | null, min: 0 };
    };
    const currentTier = getVipTier(ordersCount);
    let progress = 1;
    let nextTierText = '';
    if (currentTier.next) {
        progress = (ordersCount - currentTier.min) / (currentTier.next.min - currentTier.min);
        nextTierText = `${currentTier.next.min - ordersCount} orders away from ${currentTier.next.name}`;
    } else {
        nextTierText = 'You have reached the highest tier!';
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#080808' : '#F9F9FB' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: isDark ? '#222' : '#E5E5E5' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <ChevronLeft color={themeColor} size={28} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColor }]}>
                    {tr('fidelityProgram', 'FIDELITY PROGRAM')}
                </Text>
                <View style={styles.backBtn} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00FF9D" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingVertical: 20, paddingBottom: 110 }}
                >
                    <View style={styles.statsHeader}>
                        <Text style={[styles.totalOrdersLabel, { color: isDark ? '#AAA' : '#666' }]}>
                            {tr('totalCompletedOrders', 'Total Completed Orders')}
                        </Text>
                        <Text style={[styles.totalOrdersCount, { color: themeColor }]}>
                            {ordersCount}
                        </Text>
                    </View>

                    {/* VIP Tiers Visual */}
                    <View style={styles.tierContainer}>
                        <LinearGradient
                            colors={currentTier.color}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tierBadge}
                        >
                            <Text style={styles.tierIcon}>{currentTier.icon}</Text>
                            <Text style={styles.tierName}>{currentTier.name} VIP</Text>
                        </LinearGradient>
                        
                        <View style={styles.progressWrapper}>
                            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: currentTier.color[0] }]} />
                            </View>
                            <Text style={[styles.progressText, { color: isDark ? '#AAA' : '#666' }]}>{nextTierText}</Text>
                        </View>
                    </View>

                    <View style={{ paddingVertical: 20 }}>
                        <FlatList
                            data={cards}
                            keyExtractor={item => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            onScroll={(e) => {
                                const offset = e.nativeEvent.contentOffset.x;
                                const index = Math.round(offset / width);
                                setActiveCardIndex(index);
                            }}
                            scrollEventThrottle={16}
                            renderItem={({ item }) => (
                                <View style={{
                                    width: width,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: item.status === 'locked' ? 0.6 : 1,
                                    paddingVertical: 10, // Space for shadows
                                }}>
                                    <FidelityCard
                                        points={item.points}
                                        isCompleted={item.isCompleted}
                                        index={item.index}
                                        isDark={isDark}
                                        t={t}
                                    />
                                    {item.status === 'locked' && (
                                        <View style={styles.lockOverlay}>
                                            <Text style={styles.lockText}>{tr('locked', 'LOCKED')} #{item.index}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        />

                        {/* Pagination Dots */}
                        <View style={styles.paginationContainer}>
                            {cards.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: i === activeCardIndex ? '#00FF9D' : (isDark ? '#333' : '#CCC'),
                                            width: i === activeCardIndex ? 20 : 8
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                    <Text style={{ textAlign: 'center', paddingHorizontal: 35, color: isDark ? '#888' : '#666', marginTop: 10, fontSize: 13, lineHeight: 22, fontWeight: '500' }}>
                        {tr('fidelityGuide', 'Swipe left and right to view your loyalty cards. Complete 10 orders to fill a card and unlock exclusive rewards like discounts and free delivery!')}
                    </Text>

                    {/* Scratch & Win CTA */}
                    <TouchableOpacity
                        style={styles.scratchCTA}
                        activeOpacity={0.9}
                        onPress={() => onNavigate('ScratchAndWin')}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.scratchGradient}
                        >
                            <View style={styles.scratchInner}>
                                <View style={styles.scratchIconContainer}>
                                    <Sparkles color="#FFF" size={24} />
                                </View>
                                <View style={styles.scratchTextContainer}>
                                    <Text style={styles.scratchTitle}>{tr('scratchAndWin', 'SCRATCH & WIN')}</Text>
                                    <Text style={styles.scratchSubtitle}>{tr('tryYourLuckDaily', 'Try your luck every 24 hours!')}</Text>
                                </View>
                                <Gift color="#FFF" size={24} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 15,
        borderBottomWidth: 1,
        // Optional shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        alignItems: 'center',
    },
    statsHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    totalOrdersLabel: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    totalOrdersCount: {
        fontSize: 40,
        fontWeight: '900',
    },
    tierContainer: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(128,128,128,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.1)',
        marginBottom: 10,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    tierIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    tierName: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    progressWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
    },
    scratchCTA: {
        marginTop: 30,
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    scratchGradient: {
        padding: 16,
    },
    scratchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scratchIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scratchTextContainer: {
        flex: 1,
    },
    scratchTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    scratchSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    lockOverlay: {
        position: 'absolute',
        bottom: 5,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    lockText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    }
});

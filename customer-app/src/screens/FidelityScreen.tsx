import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { AppText as Text } from '../../App';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft } from 'lucide-react-native';
import FidelityCard from '../components/FidelityCard';

const { width } = Dimensions.get('window');

interface FidelityScreenProps {
    onBack: () => void;
    user: any;
    t: any;
    theme: string;
}

export default function FidelityScreen({ onBack, user, t, theme }: FidelityScreenProps) {
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [ordersCount, setOrdersCount] = useState(0);

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
                <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 20 }}>
                    <View style={styles.statsHeader}>
                        <Text style={[styles.totalOrdersLabel, { color: isDark ? '#AAA' : '#666' }]}>
                            {tr('totalCompletedOrders', 'Total Completed Orders')}
                        </Text>
                        <Text style={[styles.totalOrdersCount, { color: themeColor }]}>
                            {ordersCount}
                        </Text>
                    </View>
                    <View style={{ height: 260, justifyContent: 'center' }}>
                        <FlatList
                            data={cards}
                            keyExtractor={item => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={{ width: width, alignItems: 'center', opacity: item.status === 'locked' ? 0.3 : 1, justifyContent: 'center' }}>
                                    <FidelityCard
                                        points={item.points}
                                        isCompleted={item.isCompleted}
                                        index={item.index}
                                        isDark={isDark}
                                        t={t}
                                    />
                                </View>
                            )}
                        />
                    </View>
                    <Text style={{ textAlign: 'center', paddingHorizontal: 35, color: isDark ? '#888' : '#666', marginTop: 10, fontSize: 13, lineHeight: 22, fontWeight: '500' }}>
                        {tr('fidelityGuide', 'Swipe left and right to view your loyalty cards. Complete 10 orders to fill a card and unlock exclusive rewards like discounts and free delivery!')}
                    </Text>
                </View>
            )
            }
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
    }
});

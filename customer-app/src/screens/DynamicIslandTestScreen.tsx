/**
 * DynamicIslandTestScreen
 *
 * Developer-only screen to test Dynamic Island / Live Activity.
 * Access from Profile → long-press version label (or add a hidden tab).
 * Works ONLY on a native build (not Expo Go).
 * iPhone 14 Pro / 15 / 16 series required for Dynamic Island.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { OrderTrackingActivity } from '../widgets';
import {
    Activity,
    CheckCircle2,
    Truck,
    PackageCheck,
    XCircle,
    RefreshCw,
    ArrowLeft,
} from 'lucide-react-native';

const DEMO_ORDER_ID = 'BEY3A-DEBUG-001';
const DEMO_DRIVER = 'Ahmed B.';

type OrderStatus = 'accepted' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';

const STAGES: { label: string; status: OrderStatus; eta: number; progress: number; icon: any; color: string }[] = [
    { label: 'Accepted', status: 'accepted', eta: 25, progress: 0.1, icon: CheckCircle2, color: '#3B82F6' },
    { label: 'Picked Up', status: 'picked_up', eta: 18, progress: 0.35, icon: PackageCheck, color: '#8B5CF6' },
    { label: 'In Transit', status: 'in_transit', eta: 12, progress: 0.6, icon: Truck, color: '#F59E0B' },
    { label: 'Out for Delivery', status: 'out_for_delivery', eta: 4, progress: 0.85, icon: Truck, color: '#06B6D4' },
    { label: 'Delivered ✓', status: 'delivered', eta: 0, progress: 1.0, icon: CheckCircle2, color: '#10B981' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
    accepted: 'Commande acceptée',
    picked_up: 'Pris en charge',
    in_transit: 'En livraison',
    out_for_delivery: 'Presque là !',
    delivered: 'Livré !',
};

export default function DynamicIslandTestScreen({ onBack }: { onBack: () => void }) {
    const { colors, theme } = useAppTheme();
    const [busy, setBusy] = useState(false);
    const [activeStage, setActiveStage] = useState<OrderStatus | null>(null);
    const [log, setLog] = useState<string[]>(['Ready. Tap a stage to test.']);
    // Track the live LiveActivity instance (expo-widgets v55 API)
    const liveActivityRef = useRef<any>(null);

    const addLog = (msg: string) =>
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

    // iOS: factory returned by createLiveActivity - has .start() and .getInstances()
    const factory = OrderTrackingActivity as any;
    const isSupported = !!factory && (Platform.OS === 'ios' || Platform.OS === 'android');

    const stopCurrentActivities = async () => {
        // Stop our tracked instance first
        if (liveActivityRef.current) {
            await liveActivityRef.current.end?.('immediate').catch(() => { });
            liveActivityRef.current = null;
        }
        // Also stop any orphaned instances
        if (Platform.OS === 'ios' && factory?.getInstances) {
            const instances = factory.getInstances() || [];
            for (const inst of instances) {
                await inst.end?.('immediate').catch(() => { });
            }
        }
    };

    useEffect(() => {
        // Cleanup ghost activities on screen mount
        const initCleanup = async () => {
            if (isSupported && Platform.OS === 'ios' && factory?.getInstances) {
                const existing = factory.getInstances() || [];
                if (existing.length > 0) {
                    addLog(`🧹 Found ${existing.length} stale activities. Cleaning...`);
                    for (const inst of existing) {
                        await inst.end?.('immediate').catch(() => { });
                    }
                }
            }
        };
        initCleanup();
    }, [isSupported]);

    const simulateStage = async (stage: typeof STAGES[number]) => {
        if (!isSupported) {
            Alert.alert(
                '⚠️ Not Supported',
                'Native widgets work only on a native build (not Expo Go).\n\nRun: npx expo run:ios OR npx expo run:android',
                [{ text: 'OK' }]
            );
            return;
        }

        setBusy(true);
        try {
            const statusText = STATUS_LABELS[stage.status];

            if (Platform.OS === 'android') {
                const WidgetManager = require('../widgets/WidgetManager').default;
                const { WidgetType, WidgetSize, OrderStatus } = require('../widgets/types');

                await WidgetManager.getInstance().updateWidgetData(
                    WidgetType.ORDER_TRACKING,
                    WidgetSize.MEDIUM,
                    {
                        orderId: DEMO_ORDER_ID,
                        status: OrderStatus.SHIPPED,
                        statusText: statusText,
                        estimatedDelivery: Date.now() + (stage.eta * 60000),
                        progress: stage.progress,
                        items: [],
                        trackingSteps: []
                    }
                );
                addLog(`📱 Updated Android Widget → ${stage.label}`);
                setActiveStage(stage.status);
                return;
            }

            // iOS Live Activity logic (only matching props)
            const props = {
                orderId: DEMO_ORDER_ID,
                status: statusText,
                progress: stage.progress,
                etaMinutes: stage.eta,
                driverName: 'Bey3a'
            };
            addLog(`📦 Data: ${JSON.stringify(props)}`);

            if (stage.status === 'delivered') {
                await stopCurrentActivities();
                setActiveStage(null);
                addLog('✅ Live Activity ENDED');
                return;
            }

            if (liveActivityRef.current) {
                await liveActivityRef.current.update(props);
                addLog(`🔄 Updated Live Activity: ${stage.label}`);
            } else {
                const instance = factory.start(props);
                liveActivityRef.current = instance;
                addLog(`🚀 Started Live Activity: ${stage.label}`);
            }
            setActiveStage(stage.status);
        } catch (e: any) {
            const errorMsg = e.message || String(e);
            addLog(`❌ Error: ${errorMsg}`);
            if (errorMsg.includes('Maximum number') || errorMsg.includes('failed to start')) {
                addLog('💡 Stopping all stale activities...');
                await stopCurrentActivities();
            }
            console.error('Live Activity test error:', e);
        } finally {
            setBusy(false);
        }
    };

    const stopAll = async () => {
        if (!isSupported) return;
        setBusy(true);
        try {
            await stopCurrentActivities();
            setActiveStage(null);
            addLog('✅ All Live Activities stopped.');
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    const forceReset = async () => {
        if (!isSupported) return;
        setBusy(true);
        addLog('🔥 FORCE RESET...');
        try {
            await stopCurrentActivities();
            setActiveStage(null);
            addLog('✅ Reset finished. Try "Accepted" now.');
        } catch (e: any) {
            addLog(`❌ Reset Error: ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    const startExactDocsExample = async () => {
        if (!isSupported) return;
        setBusy(true);
        try {
            await stopCurrentActivities();
            addLog(`🚀 Starting EXACT docs example...`);

            const props = {
                etaMinutes: 12,
                status: 'Recherche du livreur...',
                progress: 0.25,
                orderId: 'DOCS-001',
                driverName: 'Bey3a'
            };
            addLog(`📦 Props: ${JSON.stringify(props)}`);

            const instance = factory.start(props);
            liveActivityRef.current = instance;

            addLog(`✅ Started instance!`);
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    const refresh = async () => {
        if (!isSupported) return;
        setBusy(true);
        try {
            if (Platform.OS === 'ios' && factory?.getInstances) {
                const existing = factory.getInstances() || [];
                addLog(`ℹ️ Active activities: ${existing.length}`);
                addLog(`ℹ️ Tracked ref: ${liveActivityRef.current ? 'YES' : 'NONE'}`);
            } else {
                addLog(`ℹ️ Platform: ${Platform.OS}`);
            }
        } catch (e: any) {
            addLog(`❌ ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>Dynamic Island</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>Live Activity Test</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: isSupported ? '#10B98120' : '#EF444420' }]}>
                    <Activity size={14} color={isSupported ? '#10B981' : '#EF4444'} />
                    <Text style={{ color: isSupported ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: '800', marginLeft: 4 }}>
                        {isSupported ? (Platform.OS === 'ios' ? 'READY (iOS)' : 'READY (Android)') : 'UNSUPPORTED'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Warning if not supported */}
                {!isSupported && (
                    <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                        <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 13 }}>
                            ⚠️ Requires native build + iPhone 14 Pro or newer
                        </Text>
                        <Text style={{ color: '#92400E', fontSize: 12, marginTop: 4 }}>
                            Run: npx expo run:ios{'\n'}
                            Use iPhone 14 Pro / 15 / 16 simulator or device
                        </Text>
                    </View>
                )}

                {/* Order ID Badge */}
                <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.orderLabel, { color: colors.textMuted }]}>Demo Order ID</Text>
                    <Text style={[styles.orderId, { color: colors.foreground }]}>{DEMO_ORDER_ID}</Text>
                    <Text style={[styles.orderLabel, { color: colors.textMuted, marginTop: 4 }]}>Driver: {DEMO_DRIVER}</Text>

                    <TouchableOpacity
                        style={{ backgroundColor: '#8B5CF6', marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center' }}
                        onPress={startExactDocsExample}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Start Exact Docs Example</Text>
                    </TouchableOpacity>
                </View>

                {/* Stage Buttons */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SIMULATE DELIVERY STAGES</Text>
                {STAGES.map((stage) => {
                    const IconComp = stage.icon;
                    const isActive = activeStage === stage.status;
                    return (
                        <TouchableOpacity
                            key={stage.status}
                            style={[
                                styles.stageBtn,
                                {
                                    backgroundColor: isActive ? stage.color : colors.card,
                                    borderColor: isActive ? stage.color : colors.border,
                                },
                            ]}
                            onPress={() => simulateStage(stage)}
                            disabled={busy}
                        >
                            <View style={[styles.stageBtnIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : stage.color + '18' }]}>
                                <IconComp size={20} color={isActive ? '#FFF' : stage.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.stageBtnLabel, { color: isActive ? '#FFF' : colors.foreground }]}>
                                    {stage.label}
                                </Text>
                                <Text style={[styles.stageBtnSub, { color: isActive ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                                    ETA {stage.eta}m • {Math.round(stage.progress * 100)}% complete
                                </Text>
                            </View>
                            {isActive && <CheckCircle2 size={18} color="#FFF" />}
                        </TouchableOpacity>
                    );
                })}

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.resetButton, { backgroundColor: colors.surface + '60' }]}
                        onPress={forceReset}
                        disabled={busy}
                    >
                        <RefreshCw size={18} color="#FF453A" strokeWidth={2.5} />
                        <Text style={[styles.resetButtonText, { color: '#FF453A' }]}>FORCE RESET ENGINE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.stopButton, { borderColor: colors.border }]}
                        onPress={stopAll}
                        disabled={busy}
                    >
                        <XCircle size={18} color="#FF3B30" />
                        <Text style={[styles.stopButtonText, { color: '#FF3B30' }]}>Stop All Activities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={refresh}
                        disabled={busy}
                    >
                        <RefreshCw size={16} color={colors.foreground} />
                        <Text style={{ color: colors.foreground, fontWeight: '800', marginLeft: 6 }}>Check Active</Text>
                    </TouchableOpacity>
                </View>

                {busy && <ActivityIndicator color={colors.accent} style={{ marginVertical: 8 }} />}

                {/* Log output */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 20 }]}>LOG OUTPUT</Text>
                <View style={[styles.logBox, { backgroundColor: '#0D0D0D', borderColor: colors.border }]}>
                    {log.map((line, i) => (
                        <Text key={i} style={styles.logLine}>{line}</Text>
                    ))}
                </View>

                {/* How it looks */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 20 }]}>HOW TO SEE IT</Text>
                <View style={[styles.tipBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {[
                        ['🏝️ Dynamic Island', 'Swipe down on the pill at top of screen'],
                        ['🔒 Lock Screen', 'Lock your phone while a stage is active'],
                        ['📱 Compact pill', 'Shows 🛵 on left + ETA on right at all times'],
                        ['🌀 Expanded view', 'Long-press the pill to expand'],
                    ].map(([title, desc]) => (
                        <View key={title} style={styles.tipRow}>
                            <Text style={[styles.tipTitle, { color: colors.foreground }]}>{title}</Text>
                            <Text style={[styles.tipDesc, { color: colors.textMuted }]}>{desc}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '900' },
    subtitle: { fontSize: 12, fontWeight: '600' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 'auto' },
    content: { padding: 20, paddingBottom: 60 },
    warningBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
    orderCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 24 },
    orderLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    orderId: { fontSize: 18, fontWeight: '900', fontFamily: 'monospace', marginTop: 4 },
    sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    stageBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 10,
    },
    stageBtnIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stageBtnLabel: { fontSize: 15, fontWeight: '800' },
    stageBtnSub: { fontSize: 12, marginTop: 2 },
    controls: { flexDirection: 'column', gap: 10, marginTop: 14 },
    controlBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderRadius: 14, padding: 14,
    },
    logBox: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
    logLine: { color: '#00FF88', fontFamily: 'monospace', fontSize: 11 },
    tipBox: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
    tipRow: { gap: 2 },
    tipTitle: { fontSize: 13, fontWeight: '800' },
    tipDesc: { fontSize: 12 },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        gap: 8,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '900',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        marginBottom: 10,
        gap: 8,
    },
    stopButtonText: {
        fontSize: 14,
        fontWeight: '800',
    },
});

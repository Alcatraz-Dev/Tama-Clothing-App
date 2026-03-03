/**
 * ScratchAndWinScreen.tsx
 *
 * Uses:
 *  • @shopify/react-native-skia  → real Canvas-based scratch erasure (BlendMode.clear)
 *  • react-native-reanimated v4  → spring card stack physics
 *  • react-native-gesture-handler v2 → Gesture.Pan on both deck & scratch
 *
 * ⚠️ Requires native build:  PATH=/opt/homebrew/bin:$PATH npx expo run:ios
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { ChevronLeft, Trophy, Sparkles, Gift } from 'lucide-react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    useDerivedValue,
    withSpring,
    withTiming,
    withDelay,
    interpolate,
    Extrapolation,
    runOnJS,
    FadeIn,
    SlideInDown,
    ZoomIn,
    SharedValue,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';
import {
    Canvas,
    Path,
    Group,
    Rect,
    RoundedRect,
    LinearGradient as SkiaLinearGrad,
    vec,
    Skia,
    Paint,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, query, collection, where, getDocs } from 'firebase/firestore';

import { db } from '../api/firebase';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const CARD_W = SW * 0.86;
const CARD_H = CARD_W * 0.62;
const BRUSH_R = 28;
const SWIPE_THRESHOLD = SW * 0.28;
const VELOCITY_THRESHOLD = 700;

// Coverage grid for reveal detection
const COV_COLS = 20;
const COV_ROWS = 13;
const COV_TOTAL = COV_COLS * COV_ROWS;

// ─── Gift icon grid for foil pattern ──────────────────────────────────────────
const GIFT_COLS = 6;
const GIFT_ROWS = 4;
const GIFT_SIZE = CARD_W / GIFT_COLS;
const GIFT_POSITIONS = Array.from({ length: GIFT_COLS * GIFT_ROWS }, (_, i) => ({
    x: (i % GIFT_COLS) * GIFT_SIZE + GIFT_SIZE * 0.12,
    y: Math.floor(i / GIFT_COLS) * (CARD_H / GIFT_ROWS) + (CARD_H / GIFT_ROWS) * 0.12,
    size: GIFT_SIZE * 0.65,
    rotate: (i % 3) * 20 - 20, // slight tilt variation
}));

// ─── Card prize themes ─────────────────────────────────────────────────────────
const PRIZES = [
    { id: 1, foilBg: ['#E07010', '#F09030', '#FFAA40', '#F09030', '#E07010'], accent: '#FFAA40' },
    { id: 2, foilBg: ['#B5810A', '#D4AF37', '#F5D97A', '#D4AF37', '#B5810A'], accent: '#FFD700' },
    { id: 3, foilBg: ['#1A6030', '#229950', '#30CC70', '#229950', '#1A6030'], accent: '#408A60' },
    { id: 4, foilBg: ['#0D3A7A', '#1558C0', '#3A93F5', '#1558C0', '#0D3A7A'], accent: '#60B4FF' },
    { id: 5, foilBg: ['#7010E0', '#9030F0', '#AA40FF', '#9030F0', '#7010E0'], accent: '#CC80FF' },
    { id: 6, foilBg: ['#C01040', '#E03060', '#FF5080', '#E03060', '#C01040'], accent: '#FF6090' },
    { id: 7, foilBg: ['#10A0A0', '#20C0C0', '#40E0E0', '#20C0C0', '#10A0A0'], accent: '#50F0F0' },
];

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours
// For testing
// const COOLDOWN_MS = 1 * 60 * 1000; // 1 Minutes

type Mode = 'deck' | 'scratch' | 'revealed';
type Pt = { x: number; y: number };

interface Props { onBack: () => void; user: any; t: any; theme: string; }

interface ScratchGift {
    id: string;
    amount: number;
    type: 'amount' | 'free_delivery' | 'cashback' | 'coupon';
    code?: string;
    active: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skia Gift Icon — drawn as box + ribbon (matches video Orange foil pattern)
// ─────────────────────────────────────────────────────────────────────────────
const GiftIcon = React.memo(({ x, y, size, rotate }: { x: number; y: number; size: number; rotate: number }) => {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const alpha = 'rgba(255,255,255,0.14)';
    const ribbon = 'rgba(255,255,255,0.22)';
    const transform = [{ translateX: cx }, { translateY: cy }, { rotate: (rotate * Math.PI) / 180 }, { translateX: -cx }, { translateY: -cy }];
    return (
        <Group transform={transform}>
            {/* Box body */}
            <RoundedRect x={x} y={y + size * 0.28} width={size} height={size * 0.72} r={3} color={alpha} />
            {/* Lid */}
            <RoundedRect x={x - 1} y={y + size * 0.16} width={size + 2} height={size * 0.16} r={2} color={alpha} />
            {/* Ribbon: vertical central strip */}
            <Rect x={x + size * 0.43} y={y + size * 0.16} width={size * 0.14} height={size * 0.84} color={ribbon} />
            {/* Ribbon: horizontal strip across lid */}
            <Rect x={x} y={y + size * 0.38} width={size} height={size * 0.12} color={ribbon} />
            {/* Bow left loop */}
            <RoundedRect x={x + size * 0.08} y={y} width={size * 0.35} height={size * 0.22} r={5} color={ribbon} />
            {/* Bow right loop */}
            <RoundedRect x={x + size * 0.57} y={y} width={size * 0.35} height={size * 0.22} r={5} color={ribbon} />
        </Group>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Skia Scratch Surface — foil with gift pattern + Canvas erase path
// ─────────────────────────────────────────────────────────────────────────────
const SkiaScratchSurface = React.memo(({
    foilColors, onScratch, onStart,
}: { foilColors: string[]; onScratch: (pct: number) => void; onStart: () => void; }) => {

    const scratchPath = useSharedValue(Skia.Path.Make());
    const covGrid = useRef<Set<number>>(new Set());

    const onUpdate = useCallback(({ x, y }: Pt) => {
        const col = Math.floor((x / CARD_W) * COV_COLS);
        const row = Math.floor((y / CARD_H) * COV_ROWS);
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < COV_ROWS && c >= 0 && c < COV_COLS)
                covGrid.current.add(r * COV_COLS + c);
        }
        onScratch(covGrid.current.size / COV_TOTAL);
    }, [onScratch]);

    const tap = Gesture.Pan()
        .minDistance(0)
        .onStart(({ x, y }) => {
            'worklet';
            runOnJS(onStart)();
            const p = scratchPath.value.copy();

            p.moveTo(x, y);
            p.addCircle(x, y, BRUSH_R);
            scratchPath.value = p;
            runOnJS(onUpdate)({ x, y });
        })
        .onUpdate(({ x, y }) => {
            'worklet';
            const p = scratchPath.value.copy();
            p.addCircle(x, y, BRUSH_R);
            scratchPath.value = p;
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(onUpdate)({ x, y });
        })
        .onFinalize(() => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        });

    return (
        <GestureDetector gesture={tap}>
            <View style={StyleSheet.absoluteFill}>
                <Canvas style={StyleSheet.absoluteFill}>
                    <Group layer={<Paint />}>
                        <Rect x={0} y={0} width={CARD_W} height={CARD_H}>
                            <SkiaLinearGrad
                                start={vec(0, 0)}
                                end={vec(CARD_W, CARD_H)}
                                colors={foilColors}
                            />
                        </Rect>
                        <Rect x={0} y={0} width={CARD_W} height={CARD_H}>
                            <SkiaLinearGrad
                                start={vec(0, 0)}
                                end={vec(CARD_W * 0.6, CARD_H)}
                                colors={['rgba(255,255,255,0.18)', 'transparent']}
                            />
                        </Rect>
                        {GIFT_POSITIONS.map((g, i) => (
                            <GiftIcon key={i} x={g.x} y={g.y} size={g.size} rotate={g.rotate} />
                        ))}
                        <Path
                            path={scratchPath}
                            color="rgba(0,0,0,1)"
                            style="fill"
                            blendMode="clear"
                        />
                    </Group>
                </Canvas>
            </View>
        </GestureDetector>

    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Swipeable Card in the deck
// ─────────────────────────────────────────────────────────────────────────────
const DeckCard = React.memo(({
    prize, depth, totalCards, topX, onChosen, t,
}: {
    prize: typeof PRIZES[0];
    depth: number;
    totalCards: number;
    topX: SharedValue<number>;
    onChosen: () => void;
    t: any;
}) => {

    // Only the top card (depth=0) has gesture
    const isTop = depth === 0;

    // Use a fixed max stack depth for visual calculations to prevent "tiny card" glitch
    const visualDepth = Math.min(depth, 3);
    const SCALE_MIN = 1 - visualDepth * 0.06;
    const Y_OFFSET = visualDepth * 14;

    // Cards below scale up / rise as top card is dragged away
    const animStyle = useAnimatedStyle(() => {
        if (isTop) {
            const rotate = interpolate(topX.value, [-SW, 0, SW], [-14, 0, 14]);
            return {
                transform: [
                    { translateX: topX.value },
                    { rotate: `${rotate}deg` },
                ],
            };
        }
        // depth ≥ 1: scale up as top card moves out
        const progress = Math.min(Math.abs(topX.value) / SWIPE_THRESHOLD, 1);
        const scale = interpolate(progress, [0, 1], [SCALE_MIN, SCALE_MIN + 0.06], Extrapolation.CLAMP);
        const translateY = interpolate(progress, [0, 1], [Y_OFFSET, Y_OFFSET - 10], Extrapolation.CLAMP);
        return { transform: [{ scale }, { translateY }] };
    });

    return (
        <Animated.View
            style={[
                s.stackCard,
                { zIndex: totalCards - depth },
                animStyle,
                !isTop && {
                    transform: [{ scale: SCALE_MIN }, { translateY: Y_OFFSET }],
                },
            ]}
        >
            <LinearGradient colors={['#0A0A0F', '#14141E'] as any} style={StyleSheet.absoluteFill} />
            {/* Foil preview */}
            <View style={s.stackCardFoil}>
                {GIFT_POSITIONS.slice(0, 6).map((g, i) => (
                    <Gift key={i} size={18} color={prize.accent} style={{ opacity: 0.15 + (i % 3) * 0.05 }} />
                ))}
            </View>
            {/* Amount teaser - HIDDEN AMOUNT */}
            <View style={s.stackCardCenter}>
                <View style={[s.prizeRing, { borderColor: prize.accent + '30', width: 50, height: 50, marginBottom: 8 }]}>
                    <Gift size={22} color={prize.accent} />
                </View>
                <Text style={[s.stackCardLabel, { color: 'rgba(255,255,255,0.4)' }]}>
                    {t('luckQuest', 'QUÊTE DE CHANCE')}
                </Text>
                <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[s.stackAmountBig, { color: prize.accent, marginTop: 8, textShadowColor: prize.accent + '40', textShadowRadius: 10 }]}
                >
                    {t('mysteryPrize', 'PRIX MYSTÈRE')}
                </Text>

                <Text style={[s.stackCardAmount, { color: 'rgba(255,255,255,0.3)', marginTop: 4 }]}>
                    {t('revealBelow', 'Révélez le montant en grattant')}
                </Text>
            </View>

            {isTop && (
                <TouchableOpacity style={[s.chooseBtn, { borderColor: prize.accent + '80' }]} onPress={onChosen}>
                    <Text style={[s.chooseTxt, { color: prize.accent }]}>CHOISIR CETTE CARTE →</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ScratchAndWinScreen({ onBack, user, t, theme }: Props) {
    const isDark = theme === 'dark';
    const tc = isDark ? '#FFF' : '#000';

    const [loading, setLoading] = useState(true);
    const [canScratch, setCanScratch] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
    const [availableGifts, setAvailableGifts] = useState<ScratchGift[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<Mode>('deck');
    const [cardIndex, setCardIndex] = useState(0);
    const [deckCards, setDeckCards] = useState<any[]>([]);
    const [randomAmount, setRandomAmount] = useState('5.00');
    const [currentPrize, setCurrentPrize] = useState<any>(PRIZES[0]);
    const [selectedGift, setSelectedGift] = useState<ScratchGift | null>(null);

    const topX = useSharedValue(0);
    const topY = useSharedValue(0);
    const hintOpacity = useSharedValue(1);
    const isSaving = useRef(false);

    const tr = (k: string, fb: string = k) => { const r = t(k); return r === k ? fb : r; };

    useEffect(() => {
        // Initialize deck with randomness and depth
        const shuffled = [...PRIZES, ...PRIZES, ...PRIZES].sort(() => Math.random() - 0.5);
        setDeckCards(shuffled);
        setCurrentPrize(shuffled[0]);
        checkLastScratch();
        fetchAvailableGifts();
        fetchHistory();
    }, [user]);

    useEffect(() => {
        let iv: NodeJS.Timeout;
        if (!canScratch) iv = setInterval(updateTimer, 1000);
        return () => clearInterval(iv);
    }, [canScratch]);

    const updateTimer = async () => {
        if (!user) return;
        const d = (await getDoc(doc(db, 'users', user.uid))).data();
        if (d?.lastScratch) {
            const nextScratch = d.lastScratch.toDate().getTime() + COOLDOWN_MS;
            const diff = nextScratch - Date.now();
            if (diff <= 0) {
                setCanScratch(true);
                setTimeLeft('');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        }
    };

    const checkLastScratch = async () => {
        if (!user) return;
        try {
            const d = (await getDoc(doc(db, 'users', user.uid))).data();
            if (d?.lastScratch) {
                const diff = Date.now() - d.lastScratch.toDate().getTime();
                if (diff < COOLDOWN_MS) {
                    setCanScratch(false);
                    updateTimer();
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'users', user.uid, 'prizes'),
                where('category', '==', 'scratch_win')
            );
            const snap = await getDocs(q);
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setHistory(data);
        } catch (e) { console.log('History err:', e); }
    };

    const fetchAvailableGifts = async () => {
        try {
            const q = query(collection(db, 'scratch_gifts'), where('active', '==', true));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => {
                const docData = d.data();
                return {
                    id: d.id,
                    amount: docData.amount || 0,
                    type: (docData.type as any) || 'amount',
                    code: docData.code,
                    active: docData.active ?? true
                } as ScratchGift;
            });

            if (data.length > 0) {
                setAvailableGifts(data);
            } else {
                setAvailableGifts([{ id: 'default', amount: 5, type: 'amount', active: true }]);
            }
        } catch (error) {
            console.error('Error fetching gifts:', error);
            setAvailableGifts([{ id: 'default', amount: 5, type: 'amount', active: true }]);
        }
    };

    const swipeAway = useCallback((dir: 1 | -1) => {
        topX.value = withSpring(dir * SW * 1.6, { damping: 14, stiffness: 80 }, () => {
            runOnJS(advanceDeck)();
        });
    }, []);

    const advanceDeck = useCallback(() => {
        setDeckCards(prev => {
            const next = [...prev.slice(1), prev[0]];
            setCurrentPrize(next[0]);
            return next;
        });
        topX.value = 0;
        topY.value = 0;
    }, []);

    const deckGesture = Gesture.Pan()
        .onUpdate(({ translationX, translationY }) => {
            topX.value = translationX;
            topY.value = translationY;
        })
        .onEnd(({ translationX, velocityX }) => {
            if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD) {
                runOnJS(swipeAway)(translationX > 0 ? 1 : -1);
            } else {
                topX.value = withSpring(0, { damping: 16 });
                topY.value = withSpring(0, { damping: 16 });
            }
        });

    const handleChosen = (p: any) => {
        if (isProcessing || !canScratch) return;
        setIsProcessing(true);
        isSaving.current = false; // Reset saving flag for the new card
        hintOpacity.value = 1;

        // Grouping for fairness
        const groups: Record<string, ScratchGift[]> = {};
        availableGifts.forEach(g => {
            if (!groups[g.type]) groups[g.type] = [];
            groups[g.type].push(g);
        });

        const types = Object.keys(groups);
        let chosen: ScratchGift;

        if (types.length > 0) {
            const pickedType = types[Math.floor(Math.random() * types.length)];
            const possibleGifts = groups[pickedType];
            chosen = possibleGifts[Math.floor(Math.random() * possibleGifts.length)];
        } else {
            chosen = { id: 'default-' + Date.now(), amount: 5, type: 'amount', active: true };
        }

        setSelectedGift(chosen);
        if (chosen.type === 'amount' || chosen.type === 'cashback') {
            setRandomAmount(chosen.amount.toFixed(2));
        }

        setMode('scratch');
        setCurrentPrize(p);

        // Reset processing after delay
        setTimeout(() => setIsProcessing(false), 800);
    };

    const handleScratch = useCallback((pct: number) => {
        if (pct >= 0.52 && mode === 'scratch' && !isSaving.current) {
            isSaving.current = true;
            setMode('revealed');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            saveScratch();
        }
    }, [mode, selectedGift, user]);

    const saveScratch = async () => {
        if (!user || !selectedGift) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            const updates: any = { lastScratch: serverTimestamp() };

            if (selectedGift.type === 'amount') {
                updates.loyaltyPoints = increment(selectedGift.amount);
            }

            await updateDoc(userRef, updates);

            // Record history with FULL ID and timestamp
            const prizeId = `sw_${Date.now()}`;
            await setDoc(doc(db, 'users', user.uid, 'prizes', prizeId), {
                id: prizeId,
                amount: selectedGift.amount,
                type: selectedGift.type,
                code: selectedGift.code || null,
                claimed: true,
                createdAt: serverTimestamp(),
                category: 'scratch_win'
            });

            // Stats
            const statsRef = doc(db, 'scratch_stats', 'prizes');
            await setDoc(statsRef, {
                totalAwarded: increment((selectedGift.type === 'amount' || selectedGift.type === 'cashback') ? selectedGift.amount : 0),
                count: increment(1),
                lastUpdate: serverTimestamp()
            }, { merge: true });

            fetchHistory();
        } catch (e) { console.error('Save error:', e); }
    };

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: '#060608', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FFD700" />
        </View>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[s.root, { backgroundColor: isDark ? '#060608' : '#F0F0F5' }]}>
                {/* Header */}
                <View style={[s.header, { borderBottomColor: isDark ? '#1A1A1A' : '#E8E8E8' }]}>
                    <TouchableOpacity onPress={onBack} style={s.hBtn}>
                        <ChevronLeft color={tc} size={26} />
                    </TouchableOpacity>
                    <Text style={[s.hTitle, { color: tc }]}>{tr('scratchAndWin', 'GRATTEZ ET GAGNEZ')}</Text>
                    <TouchableOpacity onPress={() => setShowHistory(true)} style={s.hBtn}>
                        <Trophy size={20} color={tc} />
                    </TouchableOpacity>
                </View>

                <View style={s.body}>
                    {/* Title Block */}
                    <Animated.View entering={FadeIn.duration(400)} style={s.titleBlock}>
                        <Text style={[s.title, { color: tc }]}>{tr('tryYourLuck', 'TENTEZ VOTRE CHANCE')}</Text>
                        <Text style={[s.subtitle, { color: isDark ? '#555' : '#999' }]}>
                            {mode === 'deck'
                                ? tr('swipeToChoose', 'Glissez pour choisir votre carte')
                                : tr('scratchBelowReward', 'Grattez pour révéler votre prix')}
                        </Text>
                    </Animated.View>

                    {/* ── COME BACK LATER ── */}
                    {!canScratch ? (
                        <Animated.View entering={SlideInDown.duration(400)} style={s.limitWrap}>
                            <View style={s.trophyRing}><Trophy size={52} color="#FFD700" /></View>
                            {timeLeft !== '' && (
                                <View style={s.timerCard}>
                                    <Text style={s.timerLbl}>{tr('luckTimer', 'PROCHAIN ESSAI DANS')}</Text>
                                    <Text style={s.timerNum}>{timeLeft}</Text>
                                </View>
                            )}
                            <Text style={[s.limitTitle, { color: tc }]}>{tr('comeBackLater', 'REVENEZ PLUS TARD')}</Text>
                            <Text style={[s.limitDesc, { color: isDark ? '#555' : '#999' }]}>
                                {tr('oneScratchPerDay', "Vous ne pouvez gratter qu'une fois toutes les 24 heures.")}
                            </Text>
                            <TouchableOpacity
                                style={[s.goBack, { borderColor: isDark ? '#2A2A2A' : '#DDD', backgroundColor: isDark ? '#111' : '#F5F5F5' }]}
                                onPress={onBack}
                            >
                                <ChevronLeft size={17} color={tc} />
                                <Text style={[s.goBackTxt, { color: tc }]}>{tr('goBack', 'RETOUR')}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={s.playArea}>
                            {/* ── DECK MODE ── */}
                            {mode === 'deck' && (
                                <GestureDetector gesture={deckGesture}>
                                    <View style={s.deckWrap}>
                                        {deckCards.slice(0, 4).reverse().map((prize, revIdx) => {
                                            const depth = (Math.min(deckCards.length, 4) - 1) - revIdx;
                                            return (
                                                <DeckCard
                                                    key={`${prize.id}-${revIdx}`}
                                                    prize={prize}
                                                    depth={depth}
                                                    totalCards={deckCards.length}
                                                    topX={topX}
                                                    onChosen={() => handleChosen(prize)}
                                                    t={tr}
                                                />
                                            );
                                        })}
                                    </View>
                                </GestureDetector>
                            )}

                            {/* ── SCRATCH MODE ── */}
                            {(mode === 'scratch' || mode === 'revealed') && (
                                <Animated.View entering={ZoomIn.springify().damping(16)} style={s.scratchWrap}>
                                    <View style={s.scratchCard}>
                                        <LinearGradient colors={['#0A0A0F', '#141420'] as any} style={StyleSheet.absoluteFill} />
                                        <View style={s.prizeContent}>
                                            <View style={[s.prizeRing, { borderColor: currentPrize.accent + '70' }]}>
                                                <Sparkles size={30} color={currentPrize.accent} />
                                            </View>
                                            <Text style={s.youWon}>{tr('youWon')}</Text>
                                            <Text
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                style={[s.prizeAmt, { color: currentPrize.accent }]}
                                            >
                                                {selectedGift?.type === 'free_delivery'
                                                    ? tr('giftTypeFreeDelivery', 'Livraison Gratuite')
                                                    : selectedGift?.type === 'coupon'
                                                        ? `${selectedGift.code}`
                                                        : `${randomAmount} TND`
                                                }
                                            </Text>
                                            {selectedGift?.type === 'coupon' && (
                                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '800', marginTop: 6, letterSpacing: 1 }}>
                                                    {selectedGift.amount}% OFF
                                                </Text>
                                            )}
                                        </View>

                                        {mode === 'scratch' && (
                                            <SkiaScratchSurface
                                                foilColors={currentPrize.foilBg}
                                                onScratch={handleScratch}
                                                onStart={() => {
                                                    hintOpacity.value = withTiming(0, { duration: 400 });
                                                }}
                                            />
                                        )}

                                        {mode === 'scratch' && (
                                            <Animated.View style={[s.hintWrap, { opacity: hintOpacity }]} pointerEvents="none">
                                                <Text style={s.hintTxt}>{tr('scratchHere', 'GRATTEZ ICI')}</Text>
                                                <View style={s.hintLine} />
                                            </Animated.View>
                                        )}
                                    </View>

                                    {mode === 'revealed' && (
                                        <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: CARD_W, marginTop: 24 }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    let msg = '';
                                                    if (selectedGift?.type === 'amount') {
                                                        msg = `${tr('prizeClaimed')} ${randomAmount} TND ${tr('addedToAccount')}`;
                                                    } else if (selectedGift?.type === 'free_delivery') {
                                                        msg = tr('giftTypeFreeDelivery');
                                                    } else if (selectedGift?.type === 'coupon') {
                                                        msg = `${tr('couponCode')}: ${selectedGift.code}`;
                                                    } else {
                                                        msg = `${tr('prizeClaimed')} ${randomAmount} TND`;
                                                    }
                                                    Alert.alert(tr('congratulations'), msg);
                                                    onBack();
                                                }}
                                                activeOpacity={0.85}
                                            >
                                                <LinearGradient
                                                    colors={[currentPrize.accent, currentPrize.accent + 'BB'] as any}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                    style={s.claimBtn}
                                                >
                                                    <Sparkles color="#000" size={18} />
                                                    <Text style={s.claimTxt}>{tr('claim', 'RÉCUPÉRER')}</Text>
                                                    <Sparkles color="#000" size={18} />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    )}
                                </Animated.View>
                            )}
                        </View>
                    )}
                </View>

                {/* 📜 WINS HISTORY MODAL */}
                {showHistory && (
                    <Animated.View entering={FadeIn} style={s.modalOverlay}>
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowHistory(false)} />
                        <Animated.View entering={SlideInDown} style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Trophy size={24} color="#FFD700" />
                                <Text style={s.modalTitle}>{tr('history', 'HISTORIQUE')}</Text>
                                <TouchableOpacity onPress={() => setShowHistory(false)} style={s.closeBtn}>
                                    <Text style={{ color: '#666', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <Animated.FlatList
                                data={history}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                renderItem={({ item }) => (
                                    <View style={s.historyItem}>
                                        <View style={s.historyLeft}>
                                            <View style={s.historyIcon}>
                                                <Gift size={16} color="#FFD700" />
                                            </View>
                                            <View>
                                                <Text style={s.historyType}>
                                                    {item.type === 'amount' ? tr('cashReward', 'Récompense Cash') :
                                                        item.type === 'coupon' ? tr('coupon', 'Coupon') :
                                                            item.type === 'cashback' ? tr('cashback', 'Cashback') :
                                                                item.type === 'free_delivery' ? tr('freeDelivery', 'Livraison Gratuite') :
                                                                    tr('reward', 'Récompense')}
                                                </Text>
                                                <Text style={s.historyDate}>
                                                    {item.createdAt?.toDate ?
                                                        item.createdAt.toDate().toLocaleDateString('fr-FR') + ' ' +
                                                        item.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                        : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={s.historyAmount}>
                                            {(item.type === 'amount' || item.type === 'cashback') ? `+${item.amount} TND` :
                                                item.type === 'coupon' ? item.code :
                                                    'FREE'}
                                        </Text>
                                    </View>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <Text style={{ color: '#555', textAlign: 'center' }}>{tr('noWinsYet', "Aucun gain pour l'instant")}</Text>
                                    </View>
                                )}
                            />
                        </Animated.View>
                    </Animated.View>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 58, paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    hTitle: { fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
    hBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    titleBlock: { alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6 },
    subtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingHorizontal: 24 },

    playArea: { width: '100%', alignItems: 'center' },

    // ── Deck ──
    deckWrap: {
        width: CARD_W,
        height: CARD_H + 80,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    stackCard: {
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        elevation: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 20,
    },
    stackCardFoil: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        position: 'absolute',
        top: 12, left: 12, right: 12,
        gap: 8,
    },
    stackCardCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    stackCardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
    stackCardAmount: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginTop: 6 },
    stackAmountBig: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
    chooseBtn: {
        position: 'absolute',
        bottom: 14,
        alignSelf: 'center',
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chooseTxt: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    // ── Scratch ──
    scratchWrap: { alignItems: 'center' },
    scratchCard: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: 22,
        overflow: 'hidden',
        elevation: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.6,
        shadowRadius: 22,
    },
    prizeContent: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    prizeRing: {
        width: 62, height: 62, borderRadius: 31, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 10,
    },
    youWon: {
        color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800',
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4,
    },
    prizeAmt: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', width: '90%' },
    hintWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    hintTxt: { fontSize: 19, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
    hintLine: { width: 44, height: 2, borderRadius: 1, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)' },
    claimBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 17, borderRadius: 16,
    },
    claimTxt: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    // ── Come Back Later ──
    limitWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
    trophyRing: {
        width: 106, height: 106, borderRadius: 53,
        backgroundColor: 'rgba(255,215,0,0.07)',
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    timerCard: {
        alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,165,0,0.07)',
        borderWidth: 1, borderColor: 'rgba(255,165,0,0.18)',
        paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginBottom: 28,
    },
    timerLbl: { color: '#FFA500', fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    timerNum: { color: '#FFA500', fontSize: 40, fontWeight: '900', letterSpacing: 3 },
    limitTitle: { fontSize: 21, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
    limitDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 32 },
    goBack: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 26, paddingVertical: 13, borderRadius: 14, borderWidth: 1,
    },
    goBackTxt: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

    // ── History Modal ──
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 10000,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0A0A0F',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        paddingHorizontal: 20,
        paddingTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
        flex: 1,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    historyType: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    historyDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    historyAmount: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '900',
    },
});

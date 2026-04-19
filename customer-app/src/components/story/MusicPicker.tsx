import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    Animated,
    PanResponder,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Music2, X, Play, Pause, Clock, Zap, Heart, Cloud, Search, Check, ChevronDown } from 'lucide-react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');
const TRIM_BAR_WIDTH = SW - 64;
const CLIP_DURATION = 15; // seconds — story clip length

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackMood = 'chill' | 'hype' | 'sad' | 'happy' | 'romantic';
export type TrackLicense = 'free' | 'cc' | 'attribution';

export type SongMeta = {
    id: string;
    title: string;
    artist: string;
    url: string;
    license: TrackLicense;
    mood: TrackMood;
    /** full track duration in seconds, 0 = unknown */
    duration: number;
    source: 'pixabay' | 'fma' | 'yt-audio-lib';
};

export type SelectedTrack = SongMeta & {
    /** chosen clip start offset in seconds */
    startTime: number;
    /** clip duration in seconds (always CLIP_DURATION) */
    duration: number;
};

type Props = {
    onSelect: (track: SelectedTrack) => void;
    onClose: () => void;
    initialTrack?: SelectedTrack | null;
};

// ─── Licensed music library ───────────────────────────────────────────────────
// All tracks: Pixabay Content License (free, no attribution required for app use)
// https://pixabay.com/service/license-summary/

const LIBRARY: SongMeta[] = [
    /* ── CHILL ── */
    {
        id: 'px-1',
        title: 'Lofi Study',
        artist: 'Coma-Media',
        url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946b8a2ebf.mp3',
        license: 'free',
        mood: 'chill',
        duration: 122,
        source: 'pixabay',
    },
    {
        id: 'px-2',
        title: 'Chill Abstract Intention',
        artist: 'Coma-Media',
        url: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3',
        license: 'free',
        mood: 'chill',
        duration: 187,
        source: 'pixabay',
    },
    {
        id: 'px-3',
        title: 'Aesthetic',
        artist: 'Tollan Kim',
        url: 'https://cdn.pixabay.com/audio/2023/02/28/audio_f940cc08bb.mp3',
        license: 'free',
        mood: 'chill',
        duration: 143,
        source: 'pixabay',
    },

    /* ── HYPE ── */
    {
        id: 'px-4',
        title: 'Epic Cinematic',
        artist: 'RomanSenykMusic',
        url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3',
        license: 'free',
        mood: 'hype',
        duration: 130,
        source: 'pixabay',
    },
    {
        id: 'px-5',
        title: 'Future Beats',
        artist: 'Muzaproduction',
        url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
        license: 'free',
        mood: 'hype',
        duration: 180,
        source: 'pixabay',
    },
    {
        id: 'px-6',
        title: 'Energy Rock',
        artist: 'SergeQuadrado',
        url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12a0d99a6b.mp3',
        license: 'free',
        mood: 'hype',
        duration: 113,
        source: 'pixabay',
    },

    /* ── HAPPY ── */
    {
        id: 'px-7',
        title: 'Happy Whistling Ukulele',
        artist: 'Olexy',
        url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
        license: 'free',
        mood: 'happy',
        duration: 166,
        source: 'pixabay',
    },
    {
        id: 'px-8',
        title: 'Summer Fun',
        artist: 'Music_For_Videos',
        url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749b7c0.mp3',
        license: 'free',
        mood: 'happy',
        duration: 138,
        source: 'pixabay',
    },

    /* ── SAD ── */
    {
        id: 'px-9',
        title: 'Sad Piano',
        artist: 'AudioCoffee',
        url: 'https://cdn.pixabay.com/audio/2022/11/17/audio_e55fb37e95.mp3',
        license: 'free',
        mood: 'sad',
        duration: 150,
        source: 'pixabay',
    },
    {
        id: 'px-10',
        title: 'Emotional Cinematic',
        artist: 'Daddy_s_Music',
        url: 'https://cdn.pixabay.com/audio/2022/10/18/audio_a72c28d95b.mp3',
        license: 'free',
        mood: 'sad',
        duration: 172,
        source: 'pixabay',
    },

    /* ── ROMANTIC ── */
    {
        id: 'px-11',
        title: 'Romantic Acoustic',
        artist: 'Pasha_Music',
        url: 'https://cdn.pixabay.com/audio/2022/08/31/audio_98e1f2ef08.mp3',
        license: 'free',
        mood: 'romantic',
        duration: 145,
        source: 'pixabay',
    },
    {
        id: 'px-12',
        title: 'Love Story',
        artist: 'Laukjemusic',
        url: 'https://cdn.pixabay.com/audio/2023/01/27/audio_90a6f1d1fc.mp3',
        license: 'free',
        mood: 'romantic',
        duration: 162,
        source: 'pixabay',
    },
];

// ─── Mood config ──────────────────────────────────────────────────────────────
const MOODS: { id: TrackMood | 'all'; label: string; icon: any; color: string }[] = [
    { id: 'all',      label: 'All',      icon: Music2, color: '#888' },
    { id: 'chill',    label: 'Chill',    icon: Cloud,  color: '#60AFFF' },
    { id: 'hype',     label: 'Hype',     icon: Zap,    color: '#FF8C00' },
    { id: 'happy',    label: 'Happy',    icon: Heart,  color: '#FF0080' },
    { id: 'sad',      label: 'Sad',      icon: Cloud,  color: '#7E6FFF' },
    { id: 'romantic', label: 'Love',     icon: Heart,  color: '#FF3B87' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ─── TrimSlider ───────────────────────────────────────────────────────────────
function TrimSlider({ totalDuration, startTime, onStartTimeChange }: {
    totalDuration: number;
    startTime: number;
    onStartTimeChange: (t: number) => void;
}) {
    const maxStart = Math.max(0, totalDuration - CLIP_DURATION);
    const windowRatio = Math.min(1, CLIP_DURATION / Math.max(totalDuration, 1));
    const windowW = TRIM_BAR_WIDTH * windowRatio;
    const pan = useRef(new Animated.Value(0)).current;
    const startXRef = useRef(0);

    const pr = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, g) => { startXRef.current = g.x0; },
        onPanResponderMove: (_, g) => {
            const dx = g.moveX - startXRef.current;
            const newStart = Math.max(0, Math.min(maxStart, (dx / TRIM_BAR_WIDTH) * totalDuration));
            onStartTimeChange(newStart);
            pan.setValue(Math.min(TRIM_BAR_WIDTH - windowW, (newStart / Math.max(totalDuration, 1)) * TRIM_BAR_WIDTH));
        },
    })).current;

    useEffect(() => {
        pan.setValue((startTime / Math.max(totalDuration, 1)) * (TRIM_BAR_WIDTH - windowW));
    }, [startTime, totalDuration]);

    return (
        <View>
            <View style={trimS.track}>
                {/* Decorative waveform */}
                <View style={trimS.waveRow}>
                    {Array.from({ length: 55 }).map((_, i) => {
                        const h = 5 + Math.abs(Math.sin(i * 0.8) * 18 + Math.sin(i * 1.4) * 8);
                        return <View key={i} style={[trimS.bar, { height: h }]} />;
                    })}
                </View>
                {/* Sliding window */}
                <Animated.View {...pr.panHandlers}
                    style={[trimS.window, { width: windowW, transform: [{ translateX: pan }] }]}
                >
                    <LinearGradient colors={['rgba(255,0,128,0.18)', 'rgba(255,140,0,0.18)']}
                        style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    <View style={trimS.handle} />
                    <View style={[trimS.handle, { right: 0, left: undefined }]} />
                </Animated.View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={trimS.label}>{fmt(startTime)}</Text>
                <Text style={trimS.label}>{fmt(Math.min(startTime + CLIP_DURATION, totalDuration))}</Text>
            </View>
        </View>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MusicPicker({ onSelect, onClose, initialTrack }: Props) {
    const insets = useSafeAreaInsets();
    const [activeMood, setActiveMood] = useState<TrackMood | 'all'>('all');
    const [query, setQuery] = useState('');
    const [previewTrack, setPreviewTrack] = useState<SongMeta | null>(initialTrack ?? null);
    const [startTime, setStartTime] = useState(initialTrack?.startTime ?? 0);
    const [totalDuration, setTotalDuration] = useState(initialTrack?.duration ?? 0);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioSource = previewTrack ? { uri: previewTrack.url } : { uri: '' };
    const player = useAudioPlayer(audioSource);

    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
    }, []);

    useEffect(() => {
        const iv = setInterval(() => {
            if (player.isLoaded && player.duration > 0) setTotalDuration(player.duration);
            setIsPlaying(player.playing);
        }, 250);
        return () => clearInterval(iv);
    }, [player]);

    useEffect(() => {
        if (player.isLoaded && previewTrack) {
            try { player.seekTo(startTime); } catch (_) {}
        }
    }, [startTime, player.isLoaded]);

    const handleSelectTrack = useCallback((track: SongMeta) => {
        if (player.isLoaded) {
            player.pause();
        }
        setPreviewTrack(track);
        setStartTime(0);
        setTotalDuration(0);
        setIsPlaying(false);
    }, [player]);

    const togglePlay = useCallback(() => {
        if (!player.isLoaded) return;
        if (player.playing) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.seekTo(startTime);
            player.play();
            setIsPlaying(true);
        }
    }, [player, startTime]);

    const handleConfirm = useCallback(() => {
        if (!previewTrack) return;
        if (player.isLoaded) player.pause();
        onSelect({ ...previewTrack, startTime, duration: CLIP_DURATION });
    }, [previewTrack, startTime, player, onSelect]);

    const filtered = LIBRARY.filter(t => {
        const matchMood = activeMood === 'all' || t.mood === activeMood;
        const matchQ = !query.trim() || t.title.toLowerCase().includes(query.toLowerCase()) || t.artist.toLowerCase().includes(query.toLowerCase());
        return matchMood && matchQ;
    });

    return (
        <View style={s.root}>

            {/* ── Header ── */}
            <BlurView intensity={80} tint="dark" style={[s.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Music</Text>
                <View style={{ width: 24 }} />
            </BlurView>

            {/* ── Search ── */}
            <View style={s.searchRow}>
                <Search size={15} color="rgba(255,255,255,0.45)" style={{ marginRight: 8 }} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Search tracks..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={query}
                    onChangeText={setQuery}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <X size={14} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Mood filter chips ── */}
            <View style={{ height: 50 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[s.moodRow, { alignItems: 'center' }]}>
                    {MOODS.map(m => {
                        const active = activeMood === m.id;
                        return (
                            <TouchableOpacity key={m.id} onPress={() => setActiveMood(m.id as any)}
                                style={[s.chip, active && { backgroundColor: m.color + '22', borderColor: m.color }]}>
                                <m.icon size={13} color={active ? m.color : 'rgba(255,255,255,0.45)'} />
                                <Text style={[s.chipText, active && { color: m.color }]}>{m.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Track list ── */}
            <FlatList
                data={filtered}
                keyExtractor={t => t.id}
                contentContainerStyle={{ paddingBottom: previewTrack ? 240 : 30 }}
                removeClippedSubviews={false}
                renderItem={({ item }) => {
                    const active = previewTrack?.id === item.id;
                    const moodColor = MOODS.find(m => m.id === item.mood)?.color ?? '#888';
                    return (
                        <TouchableOpacity style={[s.track, active && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                            onPress={() => handleSelectTrack(item)}>
                            {/* Mood pill */}
                            <View style={[s.moodDot, { backgroundColor: moodColor + '20', borderColor: moodColor }]}>
                                <Text style={[s.moodDotText, { color: moodColor }]}>{item.mood}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[s.trackTitle, active && { color: '#FF0080' }]} numberOfLines={1}>{item.title}</Text>
                                <Text style={s.trackArtist} numberOfLines={1}>{item.artist} · {fmt(item.duration)}</Text>
                            </View>
                            <View style={[s.licBadge]}>
                                <Text style={s.licText}>✓ FREE</Text>
                            </View>
                            {active && <Check size={16} color="#FF0080" style={{ marginLeft: 8 }} />}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No tracks found</Text>
                    </View>
                }
            />

            {/* ── Preview + Trim panel ── */}
            {previewTrack && (
                <View style={s.trimPanel}>
                    {/* Track info + play */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.trimTitle} numberOfLines={1}>{previewTrack.title}</Text>
                            <Text style={s.trimArtist}>{previewTrack.artist}</Text>
                        </View>
                        <TouchableOpacity style={s.playBtn} onPress={togglePlay}>
                            {!player.isLoaded
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : isPlaying ? <Pause size={18} color="#FFF" /> : <Play size={18} color="#FFF" />}
                        </TouchableOpacity>
                    </View>

                    {/* Clip label */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Clock size={12} color="rgba(255,255,255,0.45)" />
                        <Text style={s.clipLabel}>  Clip · {CLIP_DURATION}s  ·  drag to choose start point</Text>
                    </View>

                    <TrimSlider
                        totalDuration={totalDuration || previewTrack.duration || 60}
                        startTime={startTime}
                        onStartTimeChange={setStartTime}
                    />

                    {/* Confirm */}
                    <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                        <LinearGradient colors={['#FF0080', '#FF8C00']}
                            style={s.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={s.confirmText}>Use this clip  ✓</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* License notice */}
                    <Text style={s.licNote}>Pixabay Content License · Free for commercial use</Text>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0D0D0D' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 16,
    },
    headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
    moodRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },

    track: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    moodDot: {
        paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1,
    },
    moodDotText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    trackArtist: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
    licBadge: {
        paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 6, backgroundColor: 'rgba(0,200,100,0.12)',
        marginLeft: 8,
    },
    licText: { color: '#00C864', fontSize: 9, fontWeight: '800' },

    trimPanel: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        padding: 18, paddingBottom: 24,
    },
    trimTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    trimArtist: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
    playBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#FF0080', alignItems: 'center', justifyContent: 'center',
    },
    clipLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
    confirmBtn: { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
    confirmGrad: { paddingVertical: 13, alignItems: 'center' },
    confirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    licNote: { color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', marginTop: 8 },
});

const trimS = StyleSheet.create({
    track: {
        height: 52, borderRadius: 8, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative',
    },
    waveRow: { flexDirection: 'row', alignItems: 'center', height: '100%', paddingHorizontal: 4 },
    bar: { width: 3, marginHorizontal: 0.5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
    window: {
        position: 'absolute', top: 0, bottom: 0, left: 0,
        borderRadius: 8, borderWidth: 2, borderColor: '#FF0080', overflow: 'hidden',
    },
    handle: {
        position: 'absolute', left: 0, top: 6, bottom: 6,
        width: 4, backgroundColor: '#FF0080', borderRadius: 2,
    },
    label: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { X, Scan, Zap, ZapOff } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    isDark: boolean;
    t: any;
}

export default function QRScanner({ onScan, onClose, isDark, t }: QRScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flash, setFlash] = useState(false);

    const scanLineAnim = useSharedValue(0);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    useEffect(() => {
        scanLineAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    function interpolateOpacity(value: number) {
        'worklet';
        if (value < 0.1) return value * 10;
        if (value > 0.9) return (1 - value) * 10;
        return 1;
    }

    const lineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineAnim.value * SCAN_AREA_SIZE }],
        opacity: interpolateOpacity(scanLineAnim.value)
    }));

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (!scanned) {
            setScanned(true);
            onScan(data);
        }
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <Text style={{ color: isDark ? '#FFF' : '#000', textAlign: 'center', padding: 20 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonAbsolute}>
                    <X size={28} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                enableTorch={flash}
            >
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.middleContainer}>
                        <View style={styles.unfocusedContainer} />
                        <View style={styles.focusedContainer}>
                            <View style={[styles.corner, styles.topLeft, { borderColor: '#00FF9D' }]} />
                            <View style={[styles.corner, styles.topRight, { borderColor: '#00FF9D' }]} />
                            <View style={[styles.corner, styles.bottomLeft, { borderColor: '#00FF9D' }]} />
                            <View style={[styles.corner, styles.bottomRight, { borderColor: '#00FF9D' }]} />

                            <Animated.View style={[styles.scanLine, lineStyle]} />
                        </View>
                        <View style={styles.unfocusedContainer} />
                    </View>
                    <View style={[styles.unfocusedContainer, { justifyContent: 'flex-start' }]}>
                        <Text style={styles.instructionText}>
                            {t('alignQrCode')}
                        </Text>
                    </View>
                </View>

                <View style={styles.topControls}>
                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                        <X size={24} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconButton}>
                        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                        {flash ? <Zap size={24} color="#00FF9D" /> : <ZapOff size={24} color="#FFF" />}
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomControls}>
                    <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
                        <Scan size={32} color="#00FF9D" />
                        <Text style={styles.bottomBarText}>{t('scanningBadge')}</Text>
                    </BlurView>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    unfocusedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleContainer: {
        flexDirection: 'row',
        height: SCAN_AREA_SIZE,
    },
    focusedContainer: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#00FF9D',
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    instructionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
        opacity: 0.8,
    },
    topControls: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bottomBarText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    permissionBtn: {
        backgroundColor: '#00FF9D',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        alignSelf: 'center',
        marginTop: 30,
    },
    closeButtonAbsolute: {
        position: 'absolute',
        top: 60,
        right: 20,
    }
});

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Camera as CameraIcon, CheckCircle, RefreshCcw, Send } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { updateShipmentStatus } from '../utils/shipping';
import { storage } from '../api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProofOfDeliveryScreen({ shipment, onBack, onComplete, t }: any) {
    const { colors, theme } = useAppTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    const translate = t || ((k: string) => k);

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.foreground, textAlign: 'center', marginBottom: 20 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.foreground }]} onPress={requestPermission}>
                    <Text style={{ color: theme === 'dark' ? '#000' : '#FFF' }}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const result = await cameraRef.current.takePictureAsync();
                setPhoto(result);
            } catch (err) {
                Alert.alert("Error", "Failed to take photo");
            }
        }
    };

    const handleConfirm = async () => {
        if (!photo) return;
        setLoading(true);
        try {
            // Upload photo to storage
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            const photoRef = ref(storage, `delivery_proofs/${shipment.trackingId}.jpg`);
            await uploadBytes(photoRef, blob);
            const proofUrl = await getDownloadURL(photoRef);

            // Update shipment status
            await updateShipmentStatus(shipment.id, shipment.trackingId, 'Delivered', {
                proofOfDeliveryUrl: proofUrl,
                deliveredAt: Date.now()
            });

            Alert.alert(translate('success') || 'Success', translate('deliveryConfirmed') || 'Delivery confirmed successfully!');
            onComplete();
        } catch (error: any) {
            console.error(error);
            Alert.alert(translate('error') || 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>{translate('proofOfDelivery')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {photo ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.preview} />
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(128,128,128,0.8)' }]}
                            onPress={() => setPhoto(null)}
                            disabled={loading}
                        >
                            <RefreshCcw size={24} color="#FFF" />
                            <Text style={styles.actionBtnText}>{translate('retake') || 'Retake'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Send size={24} color="#FFF" />
                                    <Text style={styles.actionBtnText}>{translate('submit')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                    >
                        <View style={styles.cameraOverlay}>
                            <View style={styles.guideBox} />
                        </View>
                    </CameraView>
                    <View style={styles.cameraFooter}>
                        <Text style={[styles.hint, { color: colors.foreground, opacity: 0.7 }]}>Take a photo of the package at destination</Text>
                        <TouchableOpacity style={[styles.captureBtn, { backgroundColor: colors.foreground }]} onPress={takePhoto}>
                            <View style={[styles.captureBtnInner, { borderColor: theme === 'dark' ? '#000' : '#FFF' }]} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    guideBox: {
        width: 280,
        height: 280,
        borderWidth: 2,
        borderColor: '#FFF',
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    cameraFooter: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 30,
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    captureBtnInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
    },
    hint: {
        fontSize: 14,
        fontWeight: '700',
    },
    previewContainer: {
        flex: 1,
    },
    preview: {
        flex: 1,
    },
    previewActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        justifyContent: 'center',
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 30,
        gap: 10,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    }
});

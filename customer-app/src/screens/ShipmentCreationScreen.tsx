import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowLeft, User, Phone, MapPin, Package, ClipboardCheck, Weight, Truck, Shield, Hash } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { createShipment, generateShippingStickerHTML } from '../utils/shipping';
import { auth, storage } from '../api/firebase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ShipmentCreationScreen({ onBack, onComplete, t, hideHeader }: any) {
    const { colors, theme } = useAppTheme();
    const [loading, setLoading] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const [formData, setFormData] = useState({
        receiverName: '',
        receiverPhone: '',
        deliveryAddress: '',
        items: '',
        weight: '1.0kg',
        serviceType: 'Express',
        carrierName: 'Tama Logistics',
        carrierPhone: '+216 71 000 000'
    });

    const translate = t || ((k: string) => k);

    const handleSubmit = async () => {
        if (!formData.receiverName || !formData.receiverPhone || !formData.deliveryAddress) {
            Alert.alert(translate('error') || 'Error', translate('fillAllFields') || 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Shipment in Database
            const shipmentData = {
                senderId: auth.currentUser?.uid || 'anonymous',
                senderName: auth.currentUser?.displayName || 'Tama Client',
                receiverName: formData.receiverName,
                receiverPhone: formData.receiverPhone,
                deliveryAddress: formData.deliveryAddress,
                items: formData.items.split(',').map(i => i.trim()),
                weight: formData.weight,
                serviceType: formData.serviceType,
                carrierName: formData.carrierName,
                carrierPhone: formData.carrierPhone,
            };

            const result = await createShipment(shipmentData);

            // 2. Generate PDF Sticker
            const html = generateShippingStickerHTML({ ...shipmentData, trackingId: result.trackingId });
            const { uri } = await Print.printToFileAsync({ html });

            // 3. Share/Print locally
            // We skip Firebase Storage upload of the PDF on Mobile to avoid 'storage/unknown' blob conversion errors.
            // The shipment details are successfully stored in Firebird database above.
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

            Alert.alert(
                translate('success') || 'Success',
                `${translate('shipmentCreated') || 'Shipment created successfully!'}\nTracking ID: ${result.trackingId}`,
                [{ text: 'OK', onPress: onComplete }]
            );
        } catch (error: any) {
            Alert.alert(translate('error') || 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label: string, value: string, onChange: (v: string) => void, icon: any, placeholder: string, keyboardType: any = 'default') => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {icon}
                <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {!hideHeader && (
                <Animated.View style={styles.headerContainer}>
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                        <BlurView
                            intensity={80}
                            tint={theme === 'dark' ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[StyleSheet.absoluteFill, {
                            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                            borderBottomWidth: 1,
                            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }]} />
                    </Animated.View>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack}>
                            <ArrowLeft color={colors.foreground} size={24} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{translate('createShipment')}</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </Animated.View>
            )}

            <Animated.ScrollView
                contentContainerStyle={[styles.content, hideHeader && { paddingTop: 20 }]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{translate('clientInfo')}</Text>

                {renderInput(translate('fullName'), formData.receiverName, (v) => setFormData({ ...formData, receiverName: v }), <User size={20} color={colors.accent} />, 'John Doe')}
                {renderInput(translate('phone'), formData.receiverPhone, (v) => setFormData({ ...formData, receiverPhone: v }), <Phone size={20} color={colors.accent} />, '+216...', 'phone-pad')}
                {renderInput(translate('deliveryAddress'), formData.deliveryAddress, (v) => setFormData({ ...formData, deliveryAddress: v }), <MapPin size={20} color={colors.accent} />, 'Rue de la Liberté, Tunis')}

                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>{translate('orderDetails')}</Text>
                {renderInput(translate('orderItems'), formData.items, (v) => setFormData({ ...formData, items: v }), <Package size={20} color={colors.accent} />, 'T-Shirt XL, Blue Jeans')}
                {renderInput(translate('weight') || 'Weight', formData.weight, (v) => setFormData({ ...formData, weight: v }), <Weight size={20} color={colors.accent} />, '1.5kg')}
                {renderInput(translate('serviceType') || 'Service Type', formData.serviceType, (v) => setFormData({ ...formData, serviceType: v }), <Truck size={20} color={colors.accent} />, 'Standard / Express')}

                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>{translate('carrierInfo') || 'Carrier Information'}</Text>
                {renderInput(translate('carrierName') || 'Carrier Name', formData.carrierName, (v) => setFormData({ ...formData, carrierName: v }), <Shield size={20} color={colors.accent} />, 'Carrier Name')}
                {renderInput(translate('phone'), formData.carrierPhone, (v) => setFormData({ ...formData, carrierPhone: v }), <Phone size={20} color={colors.accent} />, '+216...', 'phone-pad')}

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme === 'dark' ? '#FFF' : '#000', marginBottom: 80 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : (
                        <>
                            <ClipboardCheck size={20} color={theme === 'dark' ? '#000' : '#FFF'} />
                            <Text style={[styles.submitBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{translate('createShipment')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
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
        letterSpacing: 2,
    },
    content: {
        padding: 20,
        paddingTop: 120,
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    submitBtn: {
        height: 65,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: '900',
    }
});

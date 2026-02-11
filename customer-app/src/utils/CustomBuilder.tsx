import { Text, View, TouchableOpacity, Image } from "react-native";
import { Camera, Video, Mic, MicOff, Users, X, MessageCircle, Gift, RefreshCw, Swords } from "lucide-react-native";

export class CustomBuilder {
    // Store for user avatars
    private static avatars: Map<string, string> = new Map();

    static registerAvatar = (userId: string, avatarUrl: string) => {
        this.avatars.set(userId, avatarUrl);
    };

    static getUserAvatar = (userId: string): string | undefined => {
        return this.avatars.get(userId);
    };

    static toggleCameraBuilder = (isOn: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <Camera size={20} color={isOn ? '#fff' : '#888'} />
            </View>
        );
    };

    static toggleMicrophoneBuilder = (isOn: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                {isOn ? <Mic size={20} color="#fff" /> : <MicOff size={20} color="#888" />}
            </View>
        );
    };

    static switchCameraBuilder = (isFront: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <RefreshCw size={20} color="#fff" />
            </View>
        );
    };

    static switchAudioOutputBuilder = (deviceType: number) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <Text style={{ color: '#fff', fontSize: 10 }}>🔊</Text>
            </View>
        );
    };

    static leaveBuilder = () => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <X size={20} color="#fff" />
            </View>
        );
    };

    static minimizingBuilder = () => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>−</Text>
            </View>
        );
    };

    static memberBuilder = (memberCount: number, requestCoHostCount: number) => {
        return (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Users size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{memberCount}</Text>
                {requestCoHostCount > 0 && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                )}
            </View>
        );
    };

    static hostAvatarBuilder = (host: any) => {
        const avatarUrl = this.getUserAvatar(host.userID);
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 }}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#666', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                            {(host.userName || 'H').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{host.userName}</Text>
            </View>
        );
    };

    static enableChatBuilder = (enableChat: boolean) => {
        return (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25, width: '100%', height: '100%' }}>
                <MessageCircle size={20} color={enableChat ? '#fff' : '#888'} />
            </View>
        );
    };

    static chatBuilder = (isOn: boolean) => {
        return (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25, width: '100%', height: '100%' }}>
                <MessageCircle size={20} color="#fff" />
            </View>
        );
    };

    static giftBuilder = () => {
        return (
            <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 0, 102, 0.8)', // TikTok Pink
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 25,
                shadowColor: '#FE2C55',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 5
            }}>
                <Gift size={20} color="#fff" strokeWidth={2.5} />
            </View>
        );
    };

    static pkBattleBuilder = () => {
        return (
            <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Professional Blue
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 25,
                borderWidth: 1.5,
                borderColor: '#FF4D4D' // Red border for PK feel
            }}>
                <Swords size={20} color="#fff" />
            </View>
        );
    };
}

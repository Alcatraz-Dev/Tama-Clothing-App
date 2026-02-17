import { Text, View, TouchableOpacity, Image } from "react-native";
import { Camera, Video, Mic, MicOff, Users, X, MessageCircle, Gift, RefreshCw, Swords } from "lucide-react-native";

export class CustomBuilder {
    // Store for user avatars
    private static avatars: Map<string, string> = new Map();
    // Store for user display names
    private static userNames: Map<string, string> = new Map();

    static registerAvatar = (userId: string, avatarUrl: string) => {
        this.avatars.set(userId, avatarUrl);
    };

    static getUserAvatar = (userId: string): string | undefined => {
        return this.avatars.get(userId);
    };

    static registerUserName = (userId: string, userName: string) => {
        this.userNames.set(userId, userName);
    };

    static getUserName = (userId: string): string | undefined => {
        return this.userNames.get(userId);
    };

    static toggleCameraBuilder = (isOn: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <Camera size={16} color={isOn ? '#fff' : '#888'} />
            </View>
        );
    };

    static toggleMicrophoneBuilder = (isOn: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                {isOn ? <Mic size={16} color="#fff" /> : <MicOff size={16} color="#888" />}
            </View>
        );
    };

    static switchCameraBuilder = (isFront: boolean) => {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}>
                <RefreshCw size={16} color="#fff" />
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
            <View style={{
                width: 27,
                height: 27,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20
            }}>
                <X size={16} color="#fff" fontSize={16} />
            </View>
        );
    };

    static minimizingBuilder = () => {
        return (
            <View style={{
                width: 27,
                height: 27,
                backgroundColor: 'rgba(0,0,0,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20
            }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>−</Text>
            </View>
        );
    };

    static memberBuilder = (memberCount: number, requestCoHostCount: number) => {
        return (
            <View style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 15,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }}>
                <Users size={12} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{Math.max(0, memberCount)}</Text>
                {requestCoHostCount > 0 && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginLeft: 2 }} />
                )}
            </View>
        );
    };

    static hostAvatarBuilder = (host: any) => {
        const avatarUrl = this.getUserAvatar(host.userID);
        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
            }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>
                                {(host.userName || 'H').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>{host.userName}</Text>
            </View>
        );
    };

    static enableChatBuilder = (enableChat: boolean) => {
        return (
            <View style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                width: 40,
                height: 40,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
            }}>
                <MessageCircle size={18} color={enableChat ? '#fff' : '#888'} />
            </View>
        );
    };

    static chatBuilder = (isOn: boolean) => {
        return (
            <View style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                width: 40,
                height: 40,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
            }}>
                <MessageCircle size={18} color="#fff" />
            </View>
        );
    };

    static giftBuilder = () => {
        return (
            <View style={{
                width: 44,
                height: 44,
                backgroundColor: 'rgba(0,0,0,0.4)', // Standard dark background
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
            }}>
                <Gift size={20} color="#fff" strokeWidth={2.5} />
            </View>
        );
    };

    static pkBattleBuilder = () => {
        return (
            <View style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(0,0,0,0.4)', // Standard dark background
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
            }}>
                <Swords size={18} color="#fff" />
            </View>
        );
    };
}

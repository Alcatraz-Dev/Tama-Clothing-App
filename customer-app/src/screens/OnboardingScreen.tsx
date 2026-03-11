import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import UniversalVideoPlayer from "../components/common/UniversalVideoPlayer";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { ArrowRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_ICON, width, height } from "../constants/layout";
import { useAppTheme } from "../context/ThemeContext";

export default function OnboardingScreen({ onFinish, t }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { colors, theme } = useAppTheme();

  const slides = [
    {
      id: "1",
      title: t("onboardTitle1") || "Redefining Luxury",
      desc:
        t("onboardDesc1") || "Discover a world of curated style and quality.",
      video: "https://assets.mixkit.co/videos/805/805-720.mp4",
    },
    {
      id: "2",
      title: t("onboardTitle2") || "Exclusive Drops",
      desc:
        t("onboardDesc2") ||
        "Get access to limited edition collaborations and trends.",
      video: "https://assets.mixkit.co/videos/23327/23327-720.mp4",
    },
    {
      id: "3",
      title: t("onboardTitle3") || "Live Shopping",
      desc:
        t("onboardDesc3") ||
        "Interact with creators and shop directly from live shows.",
      video: "https://assets.mixkit.co/videos/50641/50641-720.mp4",
    },
    {
      id: "4",
      title: t("onboardTitle4") || "Treasure Hunt",
      desc:
        t("onboardDesc4") ||
        "Search for hidden rewards and win exclusive coupons.",
      video: "https://assets.mixkit.co/videos/23330/23330-720.mp4",
    },
    {
      id: "5",
      title: t("onboardTitle5") || "Authenticity Guaranteed",
      desc:
        t("onboardDesc5") ||
        "Every item is meticulously verified by our experts to ensure premium quality.",
      video: "https://assets.mixkit.co/videos/556/556-720.mp4",
    },
    {
      id: "6",
      title: t("onboardTitle6") || "Expert Styling",
      desc:
        t("onboardDesc6") ||
        "Get personalized fashion advice and lookbooks tailored to your unique taste.",
      video: "https://assets.mixkit.co/videos/4840/4840-720.mp4",
    },
    {
      id: "7",
      title: t("onboardTitle7") || "Gifting & Rewards",
      desc:
        t("onboardDesc7") ||
        "Send digital gifts to your friends and earn diamonds as you interact.",
      video: "https://assets.mixkit.co/videos/34421/34421-720.mp4",
    },
    {
      id: "8",
      title: t("onboardTitle8") || "Smart Tracking",
      desc:
        t("onboardDesc8") ||
        "Monitor your deliveries in real-time with live map tracking.",
      video: "https://assets.mixkit.co/videos/39793/39793-720.mp4",
    },
    {
      id: "9",
      title: t("onboardTitle9") || "Flash Sales",
      desc:
        t("onboardDesc9") ||
        "Get instant access to limited-time deals with massive discounts.",
      video:
        "https://assets.mixkit.co/active_storage/video_items/100608/1730160112/100608-video-720.mp4",
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    AsyncStorage.setItem("bey3a_onboarding_seen", "true");
    onFinish();
  };

  const renderSlide = ({ item, index }: any) => (
    <View style={{ width, height }}>
      <UniversalVideoPlayer
        source={{ uri: item.video }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        isLooping
        shouldPlay={currentIndex === index}
        isMuted
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingHorizontal: 35,
          paddingBottom: 150,
        }}
      >
        <Animatable.View
          key={`slide-${index}-${item.id}`}
          animation="fadeInUp"
          duration={1000}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 38,
              fontWeight: "900",
              letterSpacing: -1.5,
              lineHeight: 44,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 17,
              fontWeight: "500",
              marginTop: 18,
              lineHeight: 25,
              marginBottom: 40,
            }}
          >
            {item.desc}
          </Text>
        </Animatable.View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Skip Button */}
      <TouchableOpacity
        onPress={handleFinish}
        style={{
          position: "absolute",
          top: 60,
          right: 25,
          zIndex: 10,
          backgroundColor: "rgba(255,255,255,0.15)",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.2,
          }}
        >
          {t("skip") || "SKIP"}
        </Text>
      </TouchableOpacity>

      {/* Pagination & CTA */}
      <View style={{ position: "absolute", bottom: 60, left: 30, right: 30 }}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 35,
            alignItems: "center",
          }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                height: 5,
                width: i === currentIndex ? 40 : 8,
                borderRadius: 3,
                backgroundColor:
                  i === currentIndex ? "#FFF" : "rgba(255,255,255,0.3)",
                marginRight: 8,
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          style={{
            height: 68,
            backgroundColor: "#FFF",
            borderRadius: 34,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 18,
            elevation: 12,
          }}
        >
          <Text
            style={{
              color: "#000",
              fontSize: 17,
              fontWeight: "900",
              letterSpacing: 1.5,
            }}
          >
            {currentIndex === slides.length - 1
              ? t("onboardGetStarted") || "GET STARTED"
              : t("onboardNext") || "CONTINUE"}
          </Text>
          <ArrowRight
            size={22}
            color="#000"
            strokeWidth={3}
            style={{ marginLeft: 12 }}
          />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
      <View
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Animatable.Image
          animation="fadeInDown"
          source={APP_ICON}
          style={{ width: 240, height: 240 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

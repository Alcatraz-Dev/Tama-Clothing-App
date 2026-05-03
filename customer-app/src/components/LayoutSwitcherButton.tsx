import React, { useState, useCallback } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { useTheme } from "@stream-io/video-react-native-sdk";
import LayoutSwitcherModal from "./LayoutSwitcherModal";
import { useLayout } from "../contexts/LayoutContext";
import { Grid } from "../assets/icons/Grid";
import { SpotLight } from "../assets/icons/SpotLight";

export const LayoutSwitcherButton = () => {
  const { theme } = useTheme();
  const { selectedLayout } = useLayout();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setAnchorPosition({ x, y: y + height, width, height });
  }, []);

  const onPress = useCallback(() => {
    setIsModalVisible((prev) => !prev);
  }, []);

  const getIcon = () => {
    const color = isModalVisible
      ? theme.colors?.iconSecondary
      : theme.colors?.iconPrimary;
    const size = theme.variants?.iconSizes?.lg || 24;

    switch (selectedLayout) {
      case "grid":
        return <Grid color={color} size={size} />;
      case "spotlight":
        return <SpotLight color={color} size={size} />;
      default:
        return <Grid color={color} size={size} />;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLayout={handleLayout}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors?.sheetPrimary || "rgba(0,0,0,0.6)",
            width: theme.variants?.roundButtonSizes?.md || 44,
            height: theme.variants?.roundButtonSizes?.md || 44,
            borderRadius: (theme.variants?.roundButtonSizes?.md || 44) / 2,
          },
        ]}
      >
        {getIcon()}
        <LayoutSwitcherModal
          isVisible={isModalVisible}
          anchorPosition={anchorPosition}
          onClose={() => setIsModalVisible(false)}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LayoutSwitcherButton;

import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  View,
} from "react-native";
import { useTheme } from "@stream-io/video-react-native-sdk";
import { useLayout } from "../contexts/LayoutContext";
import { Grid, SpotLight } from "../assets/icons";

interface AnchorPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutSwitcherModalProps {
  isVisible: boolean;
  anchorPosition?: AnchorPosition | null;
  onClose: () => void;
}

const LayoutSwitcherModal: React.FC<LayoutSwitcherModalProps> = ({
  isVisible,
  onClose,
  anchorPosition,
}) => {
  const { theme } = useTheme();
  const { selectedLayout, onLayoutSelection } = useLayout();
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const topInset = theme.variants.insets?.top || 0;
  const leftInset = theme.variants.insets?.left || 0;

  React.useEffect(() => {
    if (isVisible && anchorPosition) {
      const windowHeight = Dimensions.get("window").height;
      const windowWidth = Dimensions.get("window").width;
      let top = anchorPosition.y + anchorPosition.height / 2 + topInset;
      let left = anchorPosition.x + leftInset;

      // Ensure the popup stays within the screen bounds
      if (top + 150 > windowHeight) {
        top = anchorPosition.y - 150;
      }
      if (left + 200 > windowWidth) {
        left = windowWidth - 200;
      }

      setPopupPosition({ top, left });
    }
  }, [isVisible, anchorPosition, topInset, leftInset]);

  if (!isVisible || !anchorPosition) {
    return null;
  }

  const onPressHandler = (layout: "grid" | "spotlight") => {
    onLayoutSelection(layout);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      supportedOrientations={["portrait", "landscape"]}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View
          style={[
            styles.modal,
            { top: popupPosition.top, left: popupPosition.left },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              selectedLayout === "grid" && styles.selectedButton,
            ]}
            onPress={() => onPressHandler("grid")}
          >
            <Grid
              size={24}
              color={theme.colors?.iconPrimary || "#000"}
            />
            <Text style={[styles.buttonText, { color: theme.colors?.iconPrimary }]}>
              Grid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              selectedLayout === "spotlight" && styles.selectedButton,
            ]}
            onPress={() => onPressHandler("spotlight")}
          >
            <SpotLight
              size={24}
              color={theme.colors?.iconPrimary || "#000"}
            />
            <Text style={[styles.buttonText, { color: theme.colors?.iconPrimary }]}>
              Spotlight
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modal: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedButton: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default LayoutSwitcherModal;

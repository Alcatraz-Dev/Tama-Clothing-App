import React from "react";
import { ColorValue } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

interface GridProps {
  color?: ColorValue;
  size?: number;
}

export const Grid: React.FC<GridProps> = ({ color = "#000", size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="2"
        width="8"
        height="8"
        rx="1"
        stroke={color as string}
        strokeWidth="2"
      />
      <Rect
        x="14"
        y="2"
        width="8"
        height="8"
        rx="1"
        stroke={color as string}
        strokeWidth="2"
      />
      <Rect
        x="2"
        y="14"
        width="8"
        height="8"
        rx="1"
        stroke={color as string}
        strokeWidth="2"
      />
      <Rect
        x="14"
        y="14"
        width="8"
        height="8"
        rx="1"
        stroke={color as string}
        strokeWidth="2"
      />
    </Svg>
  );
};

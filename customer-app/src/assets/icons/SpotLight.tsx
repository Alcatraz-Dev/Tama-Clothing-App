import React from "react";
import { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface SpotLightProps {
  color?: ColorValue;
  size?: number;
}

export const SpotLight: React.FC<SpotLightProps> = ({ color = "#000", size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color as string}
        strokeWidth="2"
      />
      <Path
        d="M12 3V5"
        stroke={color as string}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M12 19V21"
        stroke={color as string}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M3 12H5"
        stroke={color as string}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M19 12H21"
        stroke={color as string}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" fill={color as string} />
    </Svg>
  );
};

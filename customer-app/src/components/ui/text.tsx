import { useColor } from '@/hooks/useColor';
import { FONT_SIZE_DEFAULT } from '@/theme/globals';
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type TextVariant =
  | 'body'
  | 'title'
  | 'subtitle'
  | 'caption'
  | 'heading'
  | 'link';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

export const Text = forwardRef<RNText, TextProps>(
  (
    { variant = 'body', lightColor, darkColor, style, children, ...props },
    ref
  ) => {
    const textColor = useColor('text', { light: lightColor, dark: darkColor });
    const mutedColor = useColor('textMuted');

    const getTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        color: textColor,
      };

      switch (variant) {
        case 'heading':
          return {
            ...baseStyle,
            fontSize: 28,
            fontWeight: '800',
          };
        case 'title':
          return {
            ...baseStyle,
            fontSize: 24,
            fontWeight: '700',
          };
        case 'subtitle':
          return {
            ...baseStyle,
            fontSize: 19,
            fontWeight: '600',
          };
        case 'caption':
          return {
            ...baseStyle,
            fontSize: FONT_SIZE_DEFAULT - 2,
            fontWeight: '400',
            color: mutedColor,
          };
        case 'link':
          return {
            ...baseStyle,
            fontSize: FONT_SIZE_DEFAULT,
            fontWeight: '500',
            textDecorationLine: 'underline',
          };
        default: // 'body'
          return {
            ...baseStyle,
            fontSize: FONT_SIZE_DEFAULT,
            fontWeight: '400',
          };
      }
    };

    const renderChildren = () => {
      if (typeof children === 'string' || typeof children === 'number' || React.isValidElement(children)) {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map((child, index) => {
          if (typeof child === 'string' || typeof child === 'number' || React.isValidElement(child)) {
            return child;
          }
          if (child === null || child === undefined) return null;
          return <React.Fragment key={index}>{JSON.stringify(child)}</React.Fragment>;
        });
      }
      if (children === null || children === undefined) return null;
      return JSON.stringify(children);
    };

    return (
      <RNText ref={ref} style={[getTextStyle(), style]} {...props}>
        {renderChildren()}
      </RNText>
    );
  }
);

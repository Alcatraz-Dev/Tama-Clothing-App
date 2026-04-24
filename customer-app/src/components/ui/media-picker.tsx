import { Button, ButtonSize, ButtonVariant } from '@/components/ui/Button';
import { useColor } from '@/hooks/useColor';
import * as ImagePicker from 'expo-image-picker';
import { LucideProps } from 'lucide-react-native';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  View as RNView,
  ViewStyle,
} from 'react-native';

export type MediaType = 'image' | 'video' | 'all';
export type MediaQuality = 'low' | 'medium' | 'high';

export interface MediaAsset {
  id: string;
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  filename?: string;
  fileSize?: number;
}

export interface MediaPickerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: React.ComponentType<LucideProps>;
  disabled?: boolean;
  mediaType?: MediaType;
  multiple?: boolean;
  maxSelection?: number;
  quality?: MediaQuality;
  buttonText?: string;
  placeholder?: string;
  camera?: boolean;
  onSelectionChange?: (assets: MediaAsset[]) => void;
  onError?: (error: string) => void;
  selectedAssets?: MediaAsset[];
}

// Helper function to compare arrays of MediaAssets
const arraysEqual = (a: MediaAsset[], b: MediaAsset[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const bItem = b[index];
    return (
      item.id === bItem.id && item.uri === bItem.uri && item.type === bItem.type
    );
  });
};

export const MediaPicker = forwardRef<RNView, MediaPickerProps>(
  (
    {
      children,
      mediaType = 'all',
      multiple = false,
      camera = false,
      maxSelection = 10,
      quality = 'high',
      onSelectionChange,
      onError,
      buttonText,
      style,
      variant,
      size,
      icon,
      disabled = false,
      selectedAssets = [],
    },
    ref
  ) => {
    const [assets, setAssets] = useState<MediaAsset[]>(selectedAssets);
    const prevSelectedAssetsRef = useRef<MediaAsset[]>(selectedAssets);

    // Update internal state when selectedAssets prop changes
    useEffect(() => {
      if (!arraysEqual(prevSelectedAssetsRef.current, selectedAssets)) {
        setAssets(selectedAssets);
        prevSelectedAssetsRef.current = selectedAssets;
      }
    }, [selectedAssets]);

    const pickMedia = async () => {
      try {
        let result;
        
        if (camera) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            onError?.('Camera permission is required');
            return;
          }

          result = await ImagePicker.launchCameraAsync({
            mediaTypes: 
              mediaType === 'image' 
                ? ImagePicker.MediaTypeOptions.Images 
                : mediaType === 'video' 
                  ? ImagePicker.MediaTypeOptions.Videos 
                  : ImagePicker.MediaTypeOptions.All,
            allowsEditing: !multiple,
            quality: quality === 'high' ? 1 : quality === 'medium' ? 0.7 : 0.3,
          });
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            onError?.('Gallery permission is required');
            return;
          }

          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 
              mediaType === 'image' 
                ? ImagePicker.MediaTypeOptions.Images 
                : mediaType === 'video' 
                  ? ImagePicker.MediaTypeOptions.Videos 
                  : ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: multiple,
            selectionLimit: multiple ? maxSelection : 1,
            quality: quality === 'high' ? 1 : quality === 'medium' ? 0.7 : 0.3,
          });
        }

        if (!result.canceled && result.assets) {
          const newAssets: MediaAsset[] = result.assets.map((asset, index) => ({
            id: `${camera ? 'camera' : 'gallery'}_${Date.now()}_${index}`,
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            width: asset.width,
            height: asset.height,
            duration: asset.duration || undefined,
            filename: asset.fileName || undefined,
            fileSize: asset.fileSize,
          }));

          handleAssetSelection(newAssets);
        }
      } catch (error) {
        onError?.(`Failed to pick media: ${error}`);
      }
    };

    const handleAssetSelection = (newAssets: MediaAsset[]) => {
      let updatedAssets: MediaAsset[];
      if (multiple) {
        updatedAssets = [...assets, ...newAssets].slice(0, maxSelection);
      } else {
        updatedAssets = newAssets;
      }
      setAssets(updatedAssets);
      prevSelectedAssetsRef.current = updatedAssets;
      onSelectionChange?.(updatedAssets);
    };

    return (
      <RNView ref={ref} style={style}>
        {children ? (
          <Pressable onPress={pickMedia} disabled={disabled}>
            {children}
          </Pressable>
        ) : (
          <Button
            onPress={pickMedia}
            disabled={disabled}
            variant={variant}
            size={size}
            icon={icon}
          >
            {buttonText ||
              `Select ${mediaType === 'all'
                ? 'Media'
                : mediaType === 'image'
                  ? 'Images'
                  : 'Videos'
              }`}
          </Button>
        )}
      </RNView>
    );
  }
);

MediaPicker.displayName = 'MediaPicker';

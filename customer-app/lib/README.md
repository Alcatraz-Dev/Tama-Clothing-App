# TamaClothing UI Library

This is a centralized UI library wrapper for the [BNA UI Library](https://ui.ahmedbna.com).

## Installation

To enable the full BNA UI library, install the package:

```bash
cd customer-app
npx expo install bna-ui
```

## Current Status

The lib folder currently exports:

- ✅ Local components from `customer-app/components/ui`
- ✅ Local hooks from `customer-app/hooks`
- ✅ Local theme from `customer-app/theme`
- ⏳ Charts (available when bna-ui is installed)

## Quick Start

### Using Local Components (Currently Available)

```tsx
import { Button, Card, Text, Badge, Avatar, Input } from '@/lib';

function ProductCard({ product }) {
  return (
    <Card>
      <Badge>{product.category}</Badge>
      <Text>{product.name}</Text>
      <Text>${product.price}</Text>
      <Button onPress={() => addToCart(product)}>
        Add to Cart
      </Button>
    </Card>
  );
}
```

### Using Hooks

```tsx
import { useColorScheme, useThemeColor } from '@/lib';

function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  const primaryColor = useThemeColor('primary');
  const backgroundColor = useThemeColor('background');
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: primaryColor }}>Hello World</Text>
    </View>
  );
}
```

### Using Theme

```tsx
import { Colors, TamaTheme } from '@/lib/theme';

function MyComponent() {
  const colorScheme = 'light'; // or 'dark'
  const colors = Colors[colorScheme];
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Hello World</Text>
    </View>
  );
}
```

## Directory Structure

```
lib/
├── index.ts         # Main entry point - re-exports everything
├── components.ts   # UI components (local + bna-ui)
├── hooks.ts         # Custom hooks (local + bna-ui)
├── charts.ts        # Chart components (bna-ui only)
├── theme.ts         # Theme utilities and configuration
└── README.md       # This file
```

## Available Resources

### Local Components (Already Implemented)
From `customer-app/components/ui`:
- Accordion, Avatar, Badge, Button, Card, Checkbox, Chip, Divider, FAB, Icon, Input, Modal, Progress, Radio, Switch, Tabs, Text, View

### BNA UI Components (65+ available after installation)
- **Layout**: Accordion, BottomSheet, Card, Carousel, Collapsible, ParallaxScrollView, ScrollView, Sheet, View
- **Forms**: Checkbox, Combobox, DatePicker, FilePicker, Input, InputOTP, MediaPicker, Picker, Radio, SearchBar, Switch
- **Media**: AudioPlayer, AudioRecorder, AudioWaveform, Camera, CameraPreview, Gallery, Image, Video
- **Feedback**: Alert, AlertDialog, Badge, HelloWave, Progress, Skeleton, Spinner, Toast
- **Navigation**: Tabs, Link
- **Display**: Avatar, Icon, Text, Separator, Table
- **Actions**: ActionSheet, Button, Popover, Share
- **Other**: AvoidKeyboard, ColorPicker, ModeToggle, Onboarding

### BNA UI Charts (18+ available after installation)
- AreaChart, BarChart, BubbleChart, CandlestickChart, ColumnChart, DoughnutChart, HeatmapChart, LineChart, PieChart, PolarAreaChart, ProgressRingChart, RadarChart, RadialBarChart, ScatterChart, StackedAreaChart, StackedBarChart, TreeMapChart

### BNA UI Hooks (5+ available after installation)
- useBottomTabOverflow - Handle bottom tab overflow
- useColorScheme - Get current color scheme (light/dark)
- useKeyboardHeight - Get keyboard height
- useModeToggle - Toggle dark/light mode
- useColor/useThemeColor - Get theme colors

## Theme Configuration

The app uses custom theme colors defined in `theme/colors.ts`. The theme supports both light and dark modes.

### Available Color Keys

```ts
// Background colors
background, card, popover, input

// Text colors  
foreground, primary, secondary, muted, textMuted

// Accent colors
accent, destructive, border, ring

// Brand colors
primary, secondary, tint

// System colors
blue, green, red, orange, yellow, pink, purple, teal, indigo
```

## Enabling Full BNA UI Library

After installing bna-ui, you can enable all components by:

1. Install the package: `npx expo install bna-ui`
2. Uncomment the exports in the lib files
3. Or replace local exports with bna-ui imports

The lib files contain commented-out bna-ui exports that you can enable once the package is installed.

## Notes

- This library is inspired by shadcn/ui
- Works with Expo (managed and bare workflow)
- Supports iOS and Android
- Provides consistent, accessible UI components
- Easy theming support (light/dark mode)
- TypeScript support out of the box

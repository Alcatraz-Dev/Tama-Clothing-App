# BNA UI Library - Complete Documentation

Source: https://ui.ahmedbna.com
Version: 2.0.4

## Installation (Already Done!)

All components have been added to the project:

```bash
# Components are in:
components/ui/     # 54 UI components
components/charts/ # 18 charts
hooks/            # 5 hooks  
theme/            # Theme files
```

---

## What's Installed

### ✅ Components (54 in `components/ui/`)

**Layout:**
- Accordion (AccordionItem, AccordionTrigger, AccordionContent)
- BottomSheet
- Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- Carousel
- Collapsible
- ParallaxScrollView
- ScrollView
- Sheet
- View

**Forms:**
- Checkbox
- Combobox
- DatePicker
- FilePicker
- Input
- InputOTP
- MediaPicker
- Picker
- RadioGroup
- SearchBar
- Switch

**Media:**
- AudioPlayer
- AudioRecorder
- AudioWaveform
- Camera
- CameraPreview
- Gallery
- Image
- Video

**Feedback:**
- Alert
- AlertDialog
- Badge
- HelloWave
- Progress
- Skeleton
- Spinner
- Toast (with useToast hook)

**Navigation:**
- Tabs (TabsList, TabsTrigger, TabsContent)
- Link

**Display:**
- Avatar
- Icon
- Text
- Separator
- Table

**Actions:**
- ActionSheet (with useActionSheet hook)
- Popover

**Other:**
- AvoidKeyboard
- ColorPicker
- ModeToggle
- Onboarding
- Button (from original project)

### ✅ Charts (18 in `components/charts/`)

| Chart | Component |
|-------|-----------|
| Area Chart | `AreaChart` |
| Bar Chart | `BarChart` |
| Bubble Chart | `BubbleChart` |
| Candlestick Chart | `CandlestickChart` |
| Chart Container | `ChartContainer` |
| Column Chart | `ColumnChart` |
| Doughnut Chart | `DoughnutChart` |
| Heatmap Chart | `HeatmapChart` |
| Line Chart | `LineChart` |
| Pie Chart | `PieChart` |
| Polar Area Chart | `PolarAreaChart` |
| Progress Ring Chart | `ProgressRingChart` |
| Radar Chart | `RadarChart` |
| Radial Bar Chart | `RadialBarChart` |
| Scatter Chart | `ScatterChart` |
| Stacked Area Chart | `StackedAreaChart` |
| Stacked Bar Chart | `StackedBarChart` |
| TreeMap Chart | `TreeMapChart` |

### ✅ Hooks (5 in `hooks/`)

```typescript
import {
  useBottomTabOverflow,  // Handle bottom tab overflow
  useColorScheme,        // Get current color scheme (light/dark)
  useKeyboardHeight,     // Get keyboard height
  useModeToggle,         // Toggle dark/light mode
  useColor,             // Get theme colors
} from '@/hooks';
```

### ✅ Theme (in `theme/`)

```typescript
import {
  ThemeProvider,       // Theme context provider
  Colors,             // Theme colors object
  lightColors,        // Light mode colors
  darkColors,        // Dark mode colors
  HEIGHT,            // Default component height
  FONT_SIZE,         // Default font size
  BORDER_RADIUS,     // Default border radius
  CORNERS,           // Default corner radius
} from '@/theme';
```

---

## Usage Examples

### Importing Components

```typescript
// UI Components
import {
  Button,
  Card,
  Text,
  Input,
  Badge,
  Avatar,
  BottomSheet,
  Toast,
  useToast,
  Tabs,
  Accordion,
} from '@/components/ui';

// Charts
import { LineChart, ChartContainer } from '@/components/charts';

// Hooks
import { useColorScheme, useKeyboardHeight } from '@/hooks';

// Theme
import { ThemeProvider, Colors } from '@/theme';
```

### Basic Component Usage

```tsx
import { Button, Card, Text, Badge } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <Text>Hello World</Text>
      <Badge>New</Badge>
      <Button onPress={() => {}}>Click Me</Button>
    </Card>
  );
}
```

### Using Hooks

```tsx
import { useColorScheme, useColor, useKeyboardHeight } from '@/hooks';

function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  const primaryColor = useColor('primary');
  const keyboardHeight = useKeyboardHeight();
}
```

### Using Charts

```tsx
import { LineChart, ChartContainer } from '@/components/charts';

const data = [
  { value: 10 },
  { value: 20 },
  { value: 15 },
];

function MyChart() {
  return (
    <ChartContainer>
      <LineChart data={data} />
    </ChartContainer>
  );
}
```

### Theme Provider

```tsx
import { ThemeProvider } from '@/theme';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Action Sheet

```tsx
import { ActionSheet, useActionSheet, Button } from '@/components/ui';

function MyComponent() {
  const { show, ActionSheet } = useActionSheet();
  
  const handlePress = () => {
    show({
      title: 'Choose an option',
      options: [
        { title: 'Edit', onPress: () => {} },
        { title: 'Delete', onPress: () => {}, destructive: true },
      ],
    });
  };
  
  return (
    <>
      <Button onPress={handlePress}>Show Actions</Button>
      {ActionSheet}
    </>
  );
}
```

### Toast

```tsx
import { Toast, useToast } from '@/components/ui';

function MyComponent() {
  const toast = useToast();
  
  const handleSave = () => {
    toast.show({
      message: 'Item saved!',
      type: 'success',
    });
  };
}
```

---

## File Structure

```
customer-app/
├── components/
│   ├── ui/           # 54 UI components (kebab-case filenames)
│   │   ├── index.ts
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   └── ...
│   └── charts/       # 18 charts
│       ├── index.ts
│       ├── line-chart.tsx
│       └── ...
├── hooks/            # 5 hooks
│   ├── index.ts
│   ├── useColorScheme.ts
│   ├── useKeyboardHeight.ts
│   └── ...
├── theme/            # Theme files
│   ├── index.ts
│   ├── colors.ts
│   ├── globals.ts
│   └── theme-provider.tsx
└── node_modules/bna-ui/  # Library source
```

---

## CLI Commands (For Future Use)

```bash
# Add more components
npx bna-ui add button card input
npx bna-ui add button --overwrite
npx bna-ui add button --yes

# Available components
accordion, action-sheet, alert, alert-dialog, audio-player, 
audio-recorder, audio-waveform, avatar, avoid-keyboard, badge, 
bottom-sheet, button, camera, camera-preview, card, carousel, 
checkbox, collapsible, color-picker, combobox, date-picker, 
file-picker, gallery, hello-wave, icon, image, input, input-otp, 
link, media-picker, mode-toggle, onboarding, parallax-scrollview, 
picker, popover, progress, radio, scroll-view, searchbar, separator, 
share, sheet, skeleton, spinner, switch, table, tabs, text, toast, 
toggle, video, view

# Charts
area-chart, bar-chart, bubble-chart, candlestick-chart, chart-container, 
column-chart, doughnut-chart, heatmap-chart, line-chart, pie-chart, 
polar-area-chart, progress-ring-chart, radar-chart, radial-bar-chart, 
scatter-chart, stacked-area-chart, stacked-bar-chart, treemap-chart
```

---

## Notes

- Library is inspired by shadcn/ui
- Works with Expo
- Supports iOS and Android
- Version 2.0.4 is installed
- All components, charts, hooks, and theme are now in your project!
- Note: Some bna-ui components have minor TypeScript type issues (Timeout type) - these are library bugs not critical for runtime

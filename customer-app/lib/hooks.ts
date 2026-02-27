/**
 * BNA UI Library - Hooks
 * 
 * Source: https://ui.ahmedbna.com/docs/hooks
 * 
 * This file exports all custom hooks from the BNA UI library.
 * Installation: npx expo install bna-ui
 * 
 * @example
 * import { useColorScheme, useThemeColor, useKeyboardHeight } from '@/lib/hooks';
 */

// Re-export local hooks (already implemented in customer-app/hooks)
export { useColorScheme as useColorSchemeLocal } from '../hooks/useColorScheme';
export { useColor as useColorLocal } from '../hooks/useColor';

// Note: When bna-ui is installed, uncomment the following exports:
// 
// Theme & Color hooks
// export { useBottomTabOverflow } from 'bna-ui';
// export { useColorScheme } from 'bna-ui';
// export { useKeyboardHeight } from 'bna-ui';
// export { useModeToggle } from 'bna-ui';
// export { useColor, useThemeColor } from 'bna-ui';

import { registerRootComponent } from 'expo';

import './src/widgets/CartHomeWidget';
import './src/widgets/DealsWidget';
import './src/widgets/OrderTrackingWidget';
import './src/widgets/RecommendationsWidget';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

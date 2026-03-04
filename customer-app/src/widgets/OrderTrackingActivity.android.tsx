import { Platform } from 'react-native';
import WidgetManager from './WidgetManager';
import { WidgetType, WidgetSize, OrderStatus } from './types';

/**
 * Android "Activity" polyfill using Home Screen Widgets.
 * Since Android doesn't have Dynamic Island / Live Activity API like iOS,
 * we use the most prominent alternative: a high-priority updated widget.
 */
class AndroidActivityPolyfill {
    private currentOrderId: string | null = null;

    async start(props: any): Promise<void> {
        this.currentOrderId = props.orderId;
        await this.update(props);
    }

    async update(props: any): Promise<void> {
        if (!props) return;

        await WidgetManager.getInstance().updateWidgetData(
            WidgetType.ORDER_TRACKING,
            WidgetSize.MEDIUM,
            {
                orderId: props.orderId || this.currentOrderId || 'UNKNOWN',
                status: OrderStatus.SHIPPED, // Generic mapping
                statusText: props.status || 'En livraison',
                progress: props.progress || 0,
                estimatedDelivery: props.etaMinutes ? Date.now() + (props.etaMinutes * 60000) : Date.now() + 900000,
                items: [],
                trackingSteps: []
            }
        );
        console.log('[AndroidActivityPolyfill] Widget Updated:', props.status);
    }

    async stop(): Promise<void> {
        // Clear or reset widget
        await WidgetManager.getInstance().updateWidgetData(
            WidgetType.ORDER_TRACKING,
            WidgetSize.MEDIUM,
            {
                orderId: '',
                status: OrderStatus.PENDING,
                statusText: 'Aucune commande active',
                items: [],
                trackingSteps: []
            }
        );
        this.currentOrderId = null;
    }

    async stopAll(): Promise<void> {
        await this.stop();
    }

    async getInstances(): Promise<any[]> {
        // Mock instance
        if (this.currentOrderId) {
            return [{
                props: { orderId: this.currentOrderId },
                update: (p: any) => this.update(p),
                end: () => this.stop()
            }];
        }
        return [];
    }
}

const OrderTrackingActivity = new AndroidActivityPolyfill();
export default OrderTrackingActivity;

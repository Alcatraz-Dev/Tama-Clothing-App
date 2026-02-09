import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    id: string;
    name: { fr: string; "ar-tn": string };
    price: number;
    quantity: number;
    image: string;
    size: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, size: string) => void;
    updateQuantity: (itemId: string, size: string, delta: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from storage on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const savedCart = await AsyncStorage.getItem('@tama_cart');
                if (savedCart) {
                    const parsed = JSON.parse(savedCart);
                    if (Array.isArray(parsed)) {
                        setCart(parsed);
                    }
                }
            } catch (e) {
                console.error('Failed to load cart', e);
            } finally {
                setIsInitialized(true);
            }
        };
        loadCart();
    }, []);

    // Save cart to storage whenever it changes (only after initial load)
    useEffect(() => {
        if (!isInitialized) return;

        const saveCart = async () => {
            try {
                await AsyncStorage.setItem('@tama_cart', JSON.stringify(cart));
            } catch (e) {
                console.error('Failed to save cart', e);
            }
        };
        saveCart();
    }, [cart, isInitialized]);


    const addToCart = (item: CartItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.size === item.size);
            if (existing) {
                return prev.map(i =>
                    (i.id === item.id && i.size === item.size)
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, item];
        });
    };

    const removeFromCart = (itemId: string, size: string) => {
        setCart(prev => prev.filter(i => !(i.id === itemId && i.size === size)));
    };

    const updateQuantity = (itemId: string, size: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === itemId && i.size === size) {
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const clearCart = () => setCart([]);

    const total = useMemo(() => {
        return cart.reduce((sum, item) => {
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0));
            return sum + (price * item.quantity);
        }, 0);
    }, [cart]);

    const itemCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            total,
            itemCount
        }}>
            {isInitialized ? children : <View style={{ flex: 1 }} />}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Layout = "grid" | "spotlight";

const LAYOUT_STORAGE_KEY = "@stream_layout";

interface LayoutContextState {
  selectedLayout: Layout;
  onLayoutSelection: (layout: Layout) => void;
}

const LayoutContext = createContext<LayoutContextState | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [selectedLayout, setSelectedLayout] = useState<Layout>("grid");

  // Load saved preference on mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const saved = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY);
        if (saved === "grid" || saved === "spotlight") {
          setSelectedLayout(saved);
        }
      } catch (error) {
        console.warn("Failed to load layout preference:", error);
      }
    };
    loadLayout();
  }, []);

  const onLayoutSelection = useCallback((layout: Layout) => {
    setSelectedLayout(layout);
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, layout).catch(console.warn);
  }, []);

  return (
    <LayoutContext.Provider value={{ selectedLayout, onLayoutSelection }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextState => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types/delivery';

interface UseLocationResult {
  location: Coordinates | null;
  errorMsg: string | null;
  isLoading: boolean;
  permissionStatus: Location.PermissionStatus | null;
  refreshLocation: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  trackingInterval?: number; // in milliseconds
  onLocationUpdate?: (location: Coordinates) => void;
}

export const useLocation = (options?: UseLocationOptions): UseLocationResult => {
  const {
    enableHighAccuracy = true,
    trackingInterval = 5000,
    onLocationUpdate,
  } = options || {};

  const [location, setLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        setIsLoading(false);
        return false;
      }
      
      setErrorMsg(null);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setErrorMsg('Error requesting location permission');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy 
          ? Location.Accuracy.High 
          : Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (error) {
      console.error('Error getting current location:', error);
      setErrorMsg('Error getting current location');
      setIsLoading(false);
      return null;
    }
  }, [enableHighAccuracy, requestPermission]);

  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    await getCurrentLocation();
  }, [getCurrentLocation]);

  // Initial location fetch
  useEffect(() => {
    getCurrentLocation();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Start continuous tracking
  const startTracking = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Remove existing subscription
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        timeInterval: trackingInterval,
        distanceInterval: 10, // Update every 10 meters
      },
      (loc) => {
        const coords: Coordinates = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(coords);
        onLocationUpdate?.(coords);
      }
    );
  }, [enableHighAccuracy, trackingInterval, onLocationUpdate, requestPermission]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  return {
    location,
    errorMsg,
    isLoading,
    permissionStatus,
    refreshLocation,
    startTracking,
    stopTracking,
  };
};

// Hook for driver location updates to Firestore
export const useDriverLocationUpdates = (
  driverId: string,
  isActive: boolean = false
) => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!isActive || !driverId) {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      return;
    }

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 5,
        },
        async (loc) => {
          const coords: Coordinates = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setLocation(coords);
          
          // Update Firestore (you would call your API here)
          // await updateDriverLocation(driverId, coords);
        }
      );
    };

    startTracking();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [driverId, isActive]);

  return location;
};

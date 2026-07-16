import { useState, useEffect, useRef } from 'react';
import { DriverLocation } from '../components/types';
import { GPS_CONFIG } from '../utils/constants';

export const useDriverLocation = () => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
      setError(null);
      setIsLoading(false);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.warn('GPS Error:', error.message);
      setError(error.message);
      setIsLoading(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      GPS_CONFIG
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, error, isLoading };
};
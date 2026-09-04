import { DeviceEventEmitter } from 'react-native';

export const DriverPublisher = {
  publish(eventType: string, payload: Record<string, unknown>) {
    DeviceEventEmitter.emit(`driver:${eventType}`, payload);
  },
};

export const deviationEvents = {
  emit(detail: { distanceM: number }) {
    DeviceEventEmitter.emit('trakbin-deviation', detail);
  },
  on(cb: (detail: { distanceM: number }) => void): () => void {
    const sub = DeviceEventEmitter.addListener('trakbin-deviation', cb);
    return () => sub.remove();
  },
};
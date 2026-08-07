import { bus } from '../bus/instance';
import { useCompanySession } from '@/lib/store/useCompanySession';

export function registerNotificationSubscriber() {
  bus.subscribe('SERVICE_ACTIVATED', 'notifications', async (e) => {
    useCompanySession.getState().addNotification(`Service activated for ${e.payload.buildingId}`, 'success');
  });
  bus.subscribe('PAYOUT_RELEASED', 'notifications', async (e) => {
    useCompanySession.getState().addNotification(`Payout released: ₦${e.payload.amount.toLocaleString()}`, 'success');
  });
}
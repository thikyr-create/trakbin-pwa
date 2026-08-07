import { bus } from '../bus/instance';
import { useCompanySession } from '@/lib/store/useCompanySession';

export function registerStoreRefreshSubscriber() {
  bus.subscribe(['SERVICE_ACTIVATED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_UPDATED', 'BUILDING_UPDATED'], 'store-refresh', async () => {
    await useCompanySession.getState().fetchServiceRequests();
  });
}
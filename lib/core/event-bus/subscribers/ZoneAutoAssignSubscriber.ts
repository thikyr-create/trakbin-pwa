import { bus } from '../bus/instance';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { autoAssignZones, fetchAutoAssignFlag } from '@/lib/features/zones/services/zoneService';

let lastRun = 0;

export function registerZoneAutoAssignSubscriber() {
  bus.subscribe(['ZONE_CREATED', 'ZONE_UPDATED', 'ZONE_DELETED', 'BUILDING_REGISTERED'], 'zone-auto-assign', async (e) => {
    const cid = e.companyId ?? useCompanySession.getState().tenant.companyId;
    if (!cid) return;
    const now = Date.now();
    if (now - lastRun < 2000) return; // debounce re-matching storms
    lastRun = now;
    const enabled = await fetchAutoAssignFlag(cid);
    if (!enabled) return;
    await autoAssignZones(cid);
  });
}
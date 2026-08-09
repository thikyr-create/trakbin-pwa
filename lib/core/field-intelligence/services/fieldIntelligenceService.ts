// lib/core/field-intelligence/services/fieldIntelligenceService.ts
import { eventProcessor } from '../processors/eventProcessor';
import { movementIntelligenceService } from './movementIntelligenceService';
import { pickupIntelligenceService } from './pickupIntelligenceService';
import { routeIntelligenceService } from './routeIntelligenceService';
import { locationIntelligenceService } from './locationIntelligenceService';
import { navigationIntelligenceService } from './navigationIntelligenceService';
import { driverIntelligenceService } from './driverIntelligenceService';
import { dataCorrectionService } from '../correctors/dataCorrectionService';
import { zoneIntelligence } from '../intelligence/zoneIntelligence';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { intelligencePolicy } from '../policies/intelligencePolicy';
import { fieldEventPublisher } from '../events/fieldEventPublisher';
import { FIELD_INTERNAL_EVENTS } from '../events/fieldEventTypes';
import type { FieldIntelligenceRecord } from '../models/FieldIntelligence';

/**
 * THE orchestrator. One entry point for the whole pipeline:
 * replay → analyze → confidence → correct → learn → feedback-ready.
 */
export const fieldIntelligenceService = {
  async runDaily(companyId: number, sinceIso: string, untilIso: string) {
    const replay = await eventProcessor.replay(companyId, sinceIso);

    await movementIntelligenceService.run(companyId, sinceIso, untilIso);
    const pickup = await pickupIntelligenceService.run(companyId, sinceIso, untilIso);
    const route = await routeIntelligenceService.run(companyId, sinceIso, untilIso);
    const location = await locationIntelligenceService.run(companyId, sinceIso, untilIso);
    const navigation = await navigationIntelligenceService.run(companyId, sinceIso, untilIso);
    const driver = await driverIntelligenceService.run(companyId, sinceIso, untilIso);
    const zones = await zoneIntelligence.learn(companyId, sinceIso);
    const corrections = await dataCorrectionService.run(companyId, sinceIso, untilIso);

    await fieldEventPublisher.emit(FIELD_INTERNAL_EVENTS.INTELLIGENCE_UPDATED, { companyId, sinceIso, untilIso });

    return { replay, pickup, route, location, navigation, driver, zones, corrections };
  },

  /**
   * The VRP's door into learned knowledge. Returns null unless the value is
   * active, confident, and fresh — otherwise the optimizer uses defaults.
   */
  async consume(companyId: number, entityType: string, entityId: string, kind: string): Promise<FieldIntelligenceRecord | null> {
    const rec = await intelligenceRepository.get(companyId, entityType, entityId, kind);
    if (!rec) return null;
    return intelligencePolicy.canConsume(rec) ? rec : null;
  },
};
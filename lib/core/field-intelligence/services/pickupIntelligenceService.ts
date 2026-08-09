// lib/core/field-intelligence/services/pickupIntelligenceService.ts
import { pickupAnalyzer } from '../analyzers/pickupAnalyzer';
import { pickupIntelligence } from '../intelligence/pickupIntelligence';

export const pickupIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const signals = await pickupAnalyzer.analyze(companyId, sinceIso, untilIso);
    const learned = await pickupIntelligence.learn(companyId, sinceIso);
    return { signals: signals.length, learned };
  },
};
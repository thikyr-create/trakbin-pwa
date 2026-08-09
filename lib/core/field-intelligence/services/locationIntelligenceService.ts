// lib/core/field-intelligence/services/locationIntelligenceService.ts
import { locationAnalyzer } from '../analyzers/locationAnalyzer';
import { locationIntelligence } from '../intelligence/locationIntelligence';

export const locationIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const signals = await locationAnalyzer.analyze(companyId, sinceIso, untilIso);
    const learned = await locationIntelligence.learn(companyId, sinceIso);
    return { signals: signals.length, learned };
  },
};
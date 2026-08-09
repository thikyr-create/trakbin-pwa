// lib/core/field-intelligence/services/driverIntelligenceService.ts
import { driverBehaviorAnalyzer } from '../analyzers/driverBehaviorAnalyzer';
import { driverIntelligence } from '../intelligence/driverIntelligence';

export const driverIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const signals = await driverBehaviorAnalyzer.analyze(companyId, sinceIso, untilIso);
    const learned = await driverIntelligence.learn(companyId, sinceIso);
    return { signals: signals.length, learned };
  },
};
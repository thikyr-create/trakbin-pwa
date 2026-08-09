// lib/core/field-intelligence/services/navigationIntelligenceService.ts
import { navigationAnalyzer } from '../analyzers/navigationAnalyzer';
import { stopAnalyzer } from '../analyzers/stopAnalyzer';

export const navigationIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const a = await navigationAnalyzer.analyze(companyId, sinceIso, untilIso);
    const b = await stopAnalyzer.analyze(companyId, sinceIso, untilIso);
    return { signals: a.length + b.length };
  },
};
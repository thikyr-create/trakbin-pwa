// lib/core/field-intelligence/services/movementIntelligenceService.ts
import { movementAnalyzer } from '../analyzers/movementAnalyzer';

export const movementIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    return movementAnalyzer.analyze(companyId, sinceIso, untilIso);
  },
};
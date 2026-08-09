// lib/core/field-intelligence/services/routeIntelligenceService.ts
import { routeAnalyzer } from '../analyzers/routeAnalyzer';
import { deviationAnalyzer } from '../analyzers/deviationAnalyzer';
import { routeIntelligence } from '../intelligence/routeIntelligence';

export const routeIntelligenceService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const a = await routeAnalyzer.analyze(companyId, sinceIso, untilIso);
    const b = await deviationAnalyzer.analyze(companyId, sinceIso, untilIso);
    const learned = await routeIntelligence.learn(companyId, sinceIso);
    return { signals: a.length + b.length, learned };
  },
};
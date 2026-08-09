// lib/core/field-intelligence/feedback/fieldFeedbackAggregator.ts
import { routingFeedbackService } from './routingFeedbackService';
import { locationFeedbackService } from './locationFeedbackService';
import { driverFeedbackService } from './driverFeedbackService';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { bus } from '@/lib/core/event-bus';

/**
 * Runs all feedback generators and publishes the terminal platform event.
 * This is the exact boundary where Field Intelligence informs the rest of Trakbin.
 */
export const fieldFeedbackAggregator = {
  async run(companyId: number): Promise<{ routing: number; location: number; driver: number; eventPublished: boolean }> {
    const [routing, location, driver] = await Promise.all([
      routingFeedbackService.generate(companyId),
      locationFeedbackService.generate(companyId),
      driverFeedbackService.generate(companyId),
    ]);

    const activeCount = (await intelligenceRepository.listByCompany(companyId))
      .filter((r: any) => r.status === 'active').length;

    let eventPublished = false;
    if (activeCount > 0) {
      try {
        bus.publish({
          type: 'FIELD_INTELLIGENCE_LEARNED',
          source: 'field-intelligence',
          payload: {
            companyId,
            source: 'field-intelligence-daily-cron',
            sampleCount: activeCount,
          },
          companyId,
        });
        eventPublished = true;
      } catch (e) {
        console.error('[field-intelligence] Failed to publish FIELD_INTELLIGENCE_LEARNED', e);
      }
    }

    return { routing, location, driver, eventPublished };
  },
};
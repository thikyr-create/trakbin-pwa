import { EventBus } from './EventBus';
import { EventDispatcher } from './EventDispatcher';
import { EventExecutor } from './EventExecutor';
import { EventPipeline } from '../pipeline/EventPipeline';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { LoggerMiddleware } from '../middleware/LoggerMiddleware';
import { MetricsMiddleware } from '../middleware/MetricsMiddleware';

const pipeline = new EventPipeline([ValidationMiddleware, LoggerMiddleware, MetricsMiddleware]);
const dispatcher = new EventDispatcher(new EventExecutor());

/** The platform messenger. Knows nothing about domains. */
export const bus = new EventBus(pipeline, dispatcher);
import type { Middleware } from '../contracts/Middleware';
import { EventError } from '../errors/EventError';

export const ValidationMiddleware: Middleware = async (ctx, next) => {
  const e = ctx.event;
  if (!e.id || !e.type || !e.occurredAt || !e.source) throw new EventError('Malformed event envelope', e);
  await next();
};
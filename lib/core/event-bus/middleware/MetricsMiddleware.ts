import type { Middleware } from '../contracts/Middleware';
const counts = new Map<string, number>();

export const MetricsMiddleware: Middleware = async (ctx, next) => {
  counts.set(ctx.event.type, (counts.get(ctx.event.type) ?? 0) + 1);
  await next();
};
export const getBusMetrics = () => Object.fromEntries(counts);
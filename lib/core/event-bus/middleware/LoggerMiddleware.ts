import type { Middleware } from '../contracts/Middleware';

export const LoggerMiddleware: Middleware = async (ctx, next) => {
  const t0 = Date.now();
  await next();
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[bus] ${ctx.event.type} · ${ctx.event.id.slice(0, 8)} · ${Date.now() - t0}ms · src=${ctx.event.source}`);
  }
};
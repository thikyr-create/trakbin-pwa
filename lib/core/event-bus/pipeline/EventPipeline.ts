import type { Middleware } from '../contracts/Middleware';
import type { ExecutionContext } from './ExecutionContext';

export class EventPipeline {
  constructor(private middlewares: Middleware[]) {}
  async run(ctx: ExecutionContext, terminal: () => Promise<void>): Promise<void> {
    const chain = (i: number): Promise<void> =>
      i >= this.middlewares.length ? terminal() : this.middlewares[i](ctx, () => chain(i + 1));
    await chain(0);
  }
}
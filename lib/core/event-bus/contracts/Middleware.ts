import type { ExecutionContext } from '../pipeline/ExecutionContext';
export type Middleware = (ctx: ExecutionContext, next: () => Promise<void>) => Promise<void>;
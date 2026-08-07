import type { PlatformEventType } from '../events';
export interface EventSubscriber {
  readonly name: string;
  readonly events: PlatformEventType[];
  handle: (event: any) => void | Promise<void>;
}
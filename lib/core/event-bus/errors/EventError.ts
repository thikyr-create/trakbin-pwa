export class EventError extends Error {
  constructor(message: string, public readonly event?: unknown) { super(message); this.name = 'EventError'; }
}
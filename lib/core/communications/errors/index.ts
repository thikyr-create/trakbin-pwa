// lib/core/communications/errors/index.ts
export class CommunicationError extends Error {
  constructor(message: string, public cause?: unknown) { super(message); this.name = 'CommunicationError'; }
}
export class EmailError extends CommunicationError { constructor(m: string, c?: unknown) { super(m, c); this.name = 'EmailError'; } }
export class ProviderError extends CommunicationError {
  constructor(message: string, public statusCode?: number, cause?: unknown) { super(message, cause); this.name = 'ProviderError'; }
}
export class TemplateError extends CommunicationError { constructor(m: string, c?: unknown) { super(m, c); this.name = 'TemplateError'; } }
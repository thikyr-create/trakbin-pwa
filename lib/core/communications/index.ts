// lib/core/communications/index.ts
export { communications, EMAIL } from './engine/communicationEngine';
export { emailChannel } from './channels';
export { ResendProvider } from './providers';
export type { EmailProvider } from './providers';
export * from './templates';
export * from './events/emailEvents';
export * from './models';
export * from './errors';
export { communicationConfig } from './config/communicationConfig';
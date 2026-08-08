// lib/core/communications/utils/id.ts
import { randomBytes } from 'crypto';
export function commId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}
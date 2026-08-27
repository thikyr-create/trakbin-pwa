/**
 * Environment-tiered backend URL.
 * Expo injects EXPO_PUBLIC_* from .env / .env.development / .env.production at build time.
 */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.100:3000'
).replace(/\/+$/, '');

export const IS_PROD = API_BASE.includes('vercel.app') || API_BASE.includes('trakbin');
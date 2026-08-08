// lib/core/communications/templates/email/index.ts
export { renderDriverCredentialsEmail, type DriverCredentialsContext } from './auth/driverCredentials/driverCredentialsTemplate';
export { renderOtpEmail, type OtpContext } from './auth/otp/otpTemplate';
export { renderVerificationEmail, type VerificationContext } from './auth/verification/verificationTemplate';
export { renderPasswordResetEmail, type PasswordResetContext } from './auth/password/passwordResetTemplate';
export { renderRecoveryEmail, type RecoveryContext } from './auth/recovery/recoveryTemplate';
export { renderTwoFactorEmail, type TwoFactorContext } from './auth/security/twoFactorTemplate';
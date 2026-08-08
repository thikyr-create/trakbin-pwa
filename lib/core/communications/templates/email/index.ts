// lib/core/communications/templates/email/index.ts
export { renderDriverCredentialsEmail, type DriverCredentialsContext } from './auth/driverCredentials/driverCredentialsTemplate';
export { renderOtpEmail, type OtpContext } from './auth/otp/otpTemplate';
export { renderVerificationEmail, type VerificationContext } from './auth/verification/verificationTemplate';
export { renderPasswordResetEmail, type PasswordResetContext } from './auth/password/passwordResetTemplate';
export { renderRecoveryEmail, type RecoveryContext } from './auth/recovery/recoveryTemplate';
export { renderTwoFactorEmail, type TwoFactorContext } from './auth/security/twoFactorTemplate';
export { renderInvoiceEmail, type InvoiceContext } from './billing/invoice/invoiceTemplate';
export { renderPaymentReceivedEmail, type PaymentContext } from './billing/payment/paymentTemplate';
export { renderBillingReminderEmail, type BillingReminderContext } from './billing/billingReminder/billingReminderTemplate';
export { renderRouteAssignmentEmail, type RouteAssignmentContext } from './operations/routeAssignment/routeAssignmentTemplate';
export { renderIncidentReportedEmail, type IncidentContext } from './operations/incident/incidentTemplate';
export { renderWelcomeEmail, type WelcomeContext } from './account/welcome/welcomeTemplate';
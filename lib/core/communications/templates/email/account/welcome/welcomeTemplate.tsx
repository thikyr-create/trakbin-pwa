// lib/core/communications/templates/email/account/welcome/welcomeTemplate.tsx
export interface WelcomeContext { name: string; companyName: string; loginUrl: string; }
export function renderWelcomeEmail(c: WelcomeContext) {
  return {
    subject: `Welcome to Trakbin, ${c.name}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Welcome, ${c.name} 👋</h2>
      <p><strong>${c.companyName}</strong> is now live on Trakbin.</p>
      <a href="${c.loginUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Go to dashboard</a>
    </div>`,
    text: `Welcome to Trakbin. Log in at ${c.loginUrl}`,
  };
}
// app/hauler-dashboard/layout.tsx
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: 'Trakbin Driver Console' };
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // enables env(safe-area-inset-*) on iOS
};

export default function HaulerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Keep --app-h equal to the *visible* viewport, updated on every resize/orientation change */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              function setH(){ document.documentElement.style.setProperty('--app-h', window.visualViewport ? window.visualViewport.height + 'px' : window.innerHeight + 'px'); }
              setH();
              if (window.visualViewport) window.visualViewport.addEventListener('resize', setH);
              window.addEventListener('orientationchange', function(){ setTimeout(setH, 150); });
              window.addEventListener('resize', setH);
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
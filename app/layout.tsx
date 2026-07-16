"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide the public "Login/Join" navbar on all dashboard and auth pages
    const hideNavbar = 
    pathname?.startsWith('/admin-dashboard') || 
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/government-portal') || 
    pathname?.startsWith('/government') ||
    pathname?.startsWith('/waste-company-dashboard') || 
    pathname?.startsWith('/hauler-dashboard') || 
    pathname?.startsWith('/caretaker-dashboard') ||
    pathname?.startsWith('/auth');

  return (
    <html lang="en">
      <body className={inter.className}>
        
        {/* ONLY SHOW THE PUBLIC NAVBAR IF WE ARE NOT ON A DASHBOARD */}
        {!hideNavbar && (
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span>
                </div>
                <a href="/auth" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-green-600 transition-all">
                  Login / Join
                </a>
              </div>
            </div>
          </nav>
        )}

        {/* PAGE CONTENT */}
        {children}
      </body>
    </html>
  );
}
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  // Hide Navbar on these pages
  const hideNavbar = 
    pathname === '/hauler-dashboard' || 
    pathname === '/waste-company-dashboard' || 
    pathname === '/caretaker-dashboard' || 
    pathname === '/auth' || 
    pathname.startsWith('/caretaker') ||
    pathname.startsWith('/driver');
  
  if (hideNavbar) return null;

  return (
    <nav className="bg-white border-b border-green-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/auth" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all">
              <Home size={16} /> Login / Join
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
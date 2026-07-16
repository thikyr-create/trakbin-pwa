   // TRIGGER BUILD TEST
import Link from 'next/link';
import { Building2, Truck, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="max-w-4xl w-full text-center space-y-8">
          
          {/* Logo Icon */}
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
            <Building2 className="w-10 h-10 text-green-600" />
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Welcome to <span className="text-green-600">Trakbin</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
              The smart waste collection tracker connecting  Haulers and Communities.
            </p>
          </div>

          {/* Features Grid (Strict Green & White) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
            <div className="p-6 rounded-2xl border border-green-100 bg-green-50/50">
              <MapPin className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Precise Tracking</h3>
              <p className="text-sm text-gray-500">GPS-verified building nodes for accurate pickups.</p>
            </div>
            <div className="p-6 rounded-2xl border border-green-100 bg-green-50/50">
              <Truck className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Hauler Routing</h3>
              <p className="text-sm text-gray-500">Optimized routes for waste collection companies.</p>
            </div>
            <div className="p-6 rounded-2xl border border-green-100 bg-green-50/50">
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Accountability</h3>
              <p className="text-sm text-gray-500">Transparent status updates for every building.</p>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="pt-4">
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform hover:-translate-y-1"
            >
              Login / Join Trakbin
              <ArrowRight size={20} />
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Already have an account? <Link href="/auth#login" className="text-green-600 font-medium hover:underline">Sign in here</Link>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400 border-t border-green-50">
        © 2026 Trakbin. All rights reserved.
      </footer>
    </div>
  );
}
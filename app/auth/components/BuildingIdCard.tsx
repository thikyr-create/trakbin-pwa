"use client";
import { X, Download, Building2, Key } from 'lucide-react';
import { useRef } from 'react';

interface BuildingIdCardProps {
  buildingId: string;
  passcode: string;
  address: string;
  onClose: () => void;
}

export default function BuildingIdCard({ buildingId, passcode, address, onClose }: BuildingIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // In a real app, you'd use html2canvas or similar to convert this to an image
    // For now, we'll trigger the browser print dialog which can save as PDF
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Your Building ID Card</h2>
          <p className="text-sm text-gray-500 mt-2">Save this card to access your dashboard</p>
        </div>

        {/* The Actual ID Card */}
        <div 
          ref={cardRef}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl mb-6 print:shadow-none print:border print:border-gray-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-lg">Trakbin</span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">CARETAKER</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-green-100 uppercase mb-1">Building ID</p>
              <p className="text-3xl font-black tracking-wider">{buildingId}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <Key className="w-5 h-5 text-green-200" />
              <div>
                <p className="text-xs font-bold text-green-100 uppercase">Passcode</p>
                <p className="text-lg font-bold">{passcode}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-green-100 uppercase mb-1">Address</p>
              <p className="text-sm font-medium">{address}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 text-center">
            <p className="text-xs text-green-100">Use these credentials to login</p>
            <p className="text-xs text-green-100 font-bold mt-1">trakbin.vercel.app</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
          >
            <Download size={18} /> Download / Print Card
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            I've Saved My Card →
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">⚠️ Keep this card secure. You'll need it to login.</p>
        </div>
      </div>
    </div>
  );
}
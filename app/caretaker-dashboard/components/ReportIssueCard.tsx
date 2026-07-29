"use client";
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function ReportIssueCard() {
  const router = useRouter();

  return (
    <div 
      className="group relative bg-white rounded-[20px] shadow-sm border border-amber-100 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400 cursor-pointer overflow-hidden"
      onClick={() => router.push("/caretaker-dashboard/report-issue")}
    >
      {/* Amber Accent Bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
      
      <div className="flex items-start justify-between mb-4 pl-2">
        <div className="bg-amber-50 p-3 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
      </div>
      
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide pl-2">Report Environmental Issue</h3>
      <p className="text-xs text-gray-500 mt-2 pl-2 leading-relaxed">
        Help keep your community clean by reporting illegal dumping, overflowing bins, or sanitation concerns.
      </p>
      
      <div className="mt-6 pl-2 flex items-center gap-1 text-sm font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
        <span>Report Issue</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}
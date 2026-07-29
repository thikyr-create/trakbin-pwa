"use client";
import { useRouter } from 'next/navigation';
import { Truck, ArrowRight } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function CollectionStatusCard() {
  const router = useRouter();
  const { schedule } = useCaretakerSession();

  const getStatusInfo = () => {
    if (!schedule) return { status: 'Scheduled', badgeColor: 'bg-gray-100 text-gray-700', icon: '⚪' };
    if (schedule.status === 'delayed') return { status: 'Delayed', badgeColor: 'bg-orange-100 text-orange-700', icon: '🟠' };
    if (schedule.status === 'missed') return { status: 'Missed', badgeColor: 'bg-red-100 text-red-700', icon: '🔴' };
    return { status: 'Scheduled', badgeColor: 'bg-green-100 text-green-700', icon: '🟢' };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer" 
      onClick={() => router.push("/caretaker-dashboard/collection")}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="bg-green-50 p-3.5 rounded-2xl"><Truck className="w-14 h-14 text-green-600" /></div>
        <span className={`${statusInfo.badgeColor} text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200`}>
          {statusInfo.icon} {statusInfo.status}
        </span>
      </div>
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Next Pickup</p>
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">
          {schedule?.next_pickup_date ? new Date(schedule.next_pickup_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No Date Set'}
        </h3>
        <p className="text-lg font-bold text-gray-700 mb-3">{schedule?.time_window || 'Time TBD'}</p>
        <p className="text-sm font-bold text-gray-500">{schedule?.frequency || 'Weekly'} • {schedule?.waste_type || 'General'}</p>
      </div>
    </div>
  );
}
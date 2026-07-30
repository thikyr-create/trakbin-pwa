"use client";
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function StatusTimeline() {
  const { activeAssignment } = useCaretakerSession();

  const steps = [
    { label: 'Submitted', status: 'completed' },
    { label: 'Under Review', status: 'completed' },
    { label: 'Zone Assigned', status: 'completed' },
    { label: 'Schedule Created', status: 'completed' },
    { label: 'Service Activated', status: activeAssignment ? 'completed' : 'current' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-bold text-gray-900 uppercase mb-6">Activation Timeline</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : step.status === 'current' ? (
                <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
              {index < steps.length - 1 && <div className={`w-0.5 h-8 mt-1 ${step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'}`} />}
            </div>
            <div className="flex-1 pb-4">
              <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
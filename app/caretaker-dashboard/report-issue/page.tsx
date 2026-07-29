"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Camera, MapPin, CheckCircle2 } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function ReportIssuePage() {
  const router = useRouter();
  const { building, createIssue } = useCaretakerSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [wasteTypes, setWasteTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const issueOptions = [
    { id: 'dumping', title: 'Illegal Dumping', icon: '🗑', desc: 'Waste dumped in unauthorized locations.' },
    { id: 'missed', title: 'Missed Collection', icon: '🚛', desc: 'Scheduled pickup was missed.' },
    { id: 'damaged', title: 'Damaged Bin', icon: '🗑️', desc: 'Bin is broken or missing.' },
    { id: 'blocked', title: 'Blocked Access', icon: '🚧', desc: 'Truck cannot access the bin.' },
    { id: 'burning', title: 'Burning Waste', icon: '🔥', desc: 'Open burning of trash observed.' },
  ];

  const handleWasteTypeToggle = (type: string) => {
    setWasteTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    // In a real app, you would upload photos to Supabase Storage here first
    // For now, we submit the text data
    await createIssue({
      issue_type: issueType,
      severity: severity,
      waste_type: wasteTypes,
      description: description,
      latitude: building?.latitude,
      longitude: building?.longitude,
      address: building?.address
    });
    setLoading(false);
    router.push('/caretaker-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 mb-6">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Environmental Issue Reporting</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          ))}
        </div>

        {/* Step 1: Issue Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Select Issue Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {issueOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setIssueType(opt.title)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${issueType === opt.title ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="font-bold text-gray-900">{opt.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!issueType} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl disabled:bg-gray-300">Next: Location & Details</button>
          </div>
        )}

        {/* Step 2: Details & Evidence */}
        {step === 2 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3">
              <MapPin className="text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-700 uppercase">Current Location</p>
                <p className="text-sm font-bold text-gray-900">{building?.address || 'Unknown Address'}</p>
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Severity</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High', 'Critical'].map(s => (
                  <button key={s} onClick={() => setSeverity(s)} className={`px-4 py-2 rounded-lg text-sm font-bold ${severity === s ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Waste Type (Only for dumping) */}
            {issueType === 'Illegal Dumping' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Waste Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Household', 'Plastic', 'Construction', 'Organic', 'Electronic', 'Medical', 'Chemical'].map(t => (
                    <button key={t} onClick={() => handleWasteTypeToggle(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${wasteTypes.includes(t) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Upload (Mockup) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Evidence Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Click to upload photos</p>
                <p className="text-xs text-gray-500">Max 10 photos</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                maxLength={500}
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Describe the issue..."
              />
              <p className="text-xs text-gray-400 text-right mt-1">{description.length} / 500</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Review</button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Review Report</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500 font-bold text-sm">Issue Type</span><span className="font-bold">{issueType}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500 font-bold text-sm">Severity</span><span className="font-bold text-amber-600">{severity}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500 font-bold text-sm">Location</span><span className="font-bold text-right text-sm">{building?.address}</span></div>
              <div className="border-b pb-2">
                <span className="text-gray-500 font-bold text-sm block mb-1">Description</span>
                <p className="text-sm text-gray-900">{description || 'No description provided.'}</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 disabled:bg-gray-400">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
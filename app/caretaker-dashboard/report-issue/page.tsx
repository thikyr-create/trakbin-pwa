"use client";
import { useState, useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Camera, MapPin, CircleCheck, Upload, X } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const supabase = supabaseBrowser;

export default function ReportIssuePage() {
  const router = useRouter();
  const { building, createIssue,refreshAll } = useCaretakerSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
    refreshAll();
  }, [refreshAll]);


  // Form State
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [wasteTypes, setWasteTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const issueOptions = [
    { id: 'dumping', title: 'Illegal Dumping', icon: 'ðŸ—‘', desc: 'Waste dumped in unauthorized locations.' },
    { id: 'missed', title: 'Missed Collection', icon: 'ðŸš›', desc: 'Scheduled pickup was missed.' },
    { id: 'damaged', title: 'Damaged Bin', icon: 'ðŸ—‘ï¸', desc: 'Bin is broken or missing.' },
    { id: 'blocked', title: 'Blocked Access', icon: '', desc: 'Truck cannot access the bin.' },
    { id: 'burning', title: 'Burning Waste', icon: 'ðŸ”¥', desc: 'Open burning of trash observed.' },
  ];

  const handleWasteTypeToggle = (type: string) => {
    setWasteTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = photos.length + newFiles.length;

    if (totalPhotos > 10) {
      alert('You can only upload a maximum of 10 photos');
      return;
    }

    setPhotos(prev => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (issueId: string) => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${issueId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('environmental-issues')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('environmental-issues')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);

      // Save to database
      await supabase.from('environmental_issue_photos').insert([{
        issue_id: issueId,
        photo_url: publicUrl,
        photo_type: 'evidence',
        uploaded_by: building?.custom_id
      }]);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setUploading(true);

    try {
      // First create the issue
      const issueNumber = `ENV-${Date.now().toString().slice(-6)}`;
      
      const { data: newIssue, error: issueError } = await supabase
        .from('environmental_issues')
        .insert([{
          issue_type: issueType,
          severity: severity,
          waste_type: wasteTypes,
          description: description,
          latitude: building?.latitude,
          longitude: building?.longitude,
          address: building?.address,
          issue_number: issueNumber,
          building_id: building?.custom_id,
          reported_by: building?.custom_id,
          company_id: building?.company_id || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (issueError) throw issueError;

      // Upload photos if any
      if (photos.length > 0) {
        await uploadPhotos(newIssue.id);
      }

      // Create audit trail
      await supabase.from('environmental_issue_history').insert([{
        issue_id: newIssue.id,
        action: 'REPORT_CREATED',
        performed_by: 'caretaker',
        metadata: { type: issueType, photo_count: photos.length }
      }]);

      alert(`Report Submitted Successfully!\nIssue ID: ${issueNumber}\n\n${photos.length} photo(s) attached.`);
      router.push('/caretaker-dashboard');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
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

            {/* Photo Upload - FUNCTIONAL */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Evidence Photos</label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= 10}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">
                  {photos.length === 0 ? 'Take Photo or Upload' : 'Add More Photos'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {photos.length}/10 photos (Max)
                </p>
              </button>

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500 font-bold text-sm">Photos</span><span className="font-bold">{photos.length}</span></div>
              <div className="border-b pb-2">
                <span className="text-gray-500 font-bold text-sm block mb-1">Description</span>
                <p className="text-sm text-gray-900">{description || 'No description provided.'}</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading Photos...
                </>
              ) : loading ? (
                'Submitting...'
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
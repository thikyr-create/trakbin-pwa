export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-bold">Loading map...</p>
      </div>
    </div>
  );
}
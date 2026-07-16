"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 rounded-[18px] p-6 max-w-sm text-center">
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-[18px] hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
"use client";

import { useRef } from 'react';

interface Props { length?: number; value: string; onChange: (v: string) => void; }

export default function OTPInput({ length = 6, value, onChange }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handle = (i: number, v: string) => {
    const d = v.replace(/\D/g, '');
    const arr = digits.slice();
    if (!d) { arr[i] = ''; onChange(arr.join('')); return; }
    let idx = i;
    for (const ch of d) { if (idx >= length) break; arr[idx] = ch; idx++; }
    onChange(arr.join(''));
    refs.current[Math.min(idx, length - 1)]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          maxLength={i === 0 ? length : 1}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          className="h-12 w-10 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        />
      ))}
    </div>
  );
}
"use client";

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';

interface SwipeButtonProps {
  onSwipe: () => void;
}

export default function SwipeButton({ onSwipe }: SwipeButtonProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  
  // Transform the background color as you swipe
  const backgroundColor = useTransform(x, [0, 200], ["#059669", "#10B981"]);

  const handleDragEnd = () => {
    if (x.get() > 200) {
      setIsSwiped(true);
      // Wait for animation, then trigger completion
      setTimeout(() => {
        onSwipe();
        setIsSwiped(false);
        x.set(0); // Reset
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-14 bg-emerald-700 rounded-xl overflow-hidden select-none">
      {/* Background Track */}
      <motion.div 
        style={{ backgroundColor }} 
        className="absolute inset-0 z-0" 
      />
      
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <span className="text-white font-black uppercase tracking-wider text-sm drop-shadow-md">
          {isSwiped ? 'Completing...' : 'Swipe to Complete Pickup >>>'}
        </span>
      </div>

      {/* Draggable Thumb */}
      <motion.div
        className="absolute top-1.5 left-1.5 w-11 h-11 bg-white rounded-lg flex items-center justify-center shadow-lg z-20 cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 208 }} // 208 = container width (approx) - thumb width - padding
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={isSwiped ? { x: 208 } : { x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Check size={24} className="text-emerald-600" />
      </motion.div>
    </div>
  );
}
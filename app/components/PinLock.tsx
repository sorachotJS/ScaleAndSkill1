'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, Unlock } from 'lucide-react';

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // ดึงรหัสจริงจาก Env (แปลงเป็น String กันเหนียว)
  const CORRECT_PIN = process.env.NEXT_PUBLIC_MONEY_PIN || '0000';

  useEffect(() => {
    if (pin.length === CORRECT_PIN.length) {
      if (pin === CORRECT_PIN) {
        // ✅ รหัสถูก -> ปลดล็อค
        onUnlock();
      } else {
        // ❌ รหัสผิด -> สั่นแจ้งเตือน + ล้างค่า
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, CORRECT_PIN, onUnlock]);

  const handlePress = (num: string) => {
    if (pin.length < CORRECT_PIN.length) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center text-white">
      
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full bg-stone-800 ${error ? 'animate-shake text-red-500' : 'text-[#C5A059]'}`}>
          {pin.length === CORRECT_PIN.length && !error ? <Unlock size={32}/> : <Lock size={32}/>}
        </div>
        <h2 className="text-xl font-bold tracking-widest text-stone-400">SECURE ZONE</h2>
      </div>

      {/* Dots Display */}
      <div className="flex gap-4 mb-12">
        {[...Array(CORRECT_PIN.length)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < pin.length ? 'bg-[#C5A059] scale-110' : 'bg-stone-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs px-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-20 h-20 rounded-full bg-stone-800 text-2xl font-bold hover:bg-stone-700 active:bg-[#C5A059] active:text-stone-900 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        
        <div className="w-20 h-20"></div> {/* Spacer */}
        
        <button
          onClick={() => handlePress('0')}
          className="w-20 h-20 rounded-full bg-stone-800 text-2xl font-bold hover:bg-stone-700 active:bg-[#C5A059] active:text-stone-900 transition-all flex items-center justify-center"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="w-20 h-20 rounded-full bg-transparent text-stone-500 hover:text-red-400 flex items-center justify-center"
        >
          <Delete size={28} />
        </button>
      </div>

      {/* Shake Animation CSS (ใส่ใน globals.css หรือ tailwind config ก็ได้ แต่ใส่นี่เพื่อความเร็ว) */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
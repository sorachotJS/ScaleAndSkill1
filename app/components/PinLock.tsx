'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, Unlock, AlertTriangle, Timer } from 'lucide-react';

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // --- CONFIG ---
  const MAX_ATTEMPTS = 3;             // ผิดได้ 3 ครั้ง
  const LOCK_DURATION = 60 * 60 * 1000; // 1 ชั่วโมง (หน่วย ms)
  const CORRECT_PIN = process.env.NEXT_PUBLIC_MONEY_PIN || '0000';

  // --- 1. CHECK LOCK STATUS ON LOAD ---
  useEffect(() => {
    const checkLockStatus = () => {
      const lockUntil = localStorage.getItem('pin_lock_until');
      
      if (lockUntil) {
        const remaining = parseInt(lockUntil) - Date.now();
        
        if (remaining > 0) {
          // ยังติดล็อคอยู่
          setIsLocked(true);
          setTimeLeft(remaining);
        } else {
          // หมดเวลาล็อคแล้ว -> ล้างค่า
          localStorage.removeItem('pin_lock_until');
          localStorage.removeItem('pin_attempts');
          setIsLocked(false);
        }
      }
    };

    checkLockStatus();
    // เช็คทุก 1 วินาทีเพื่ออัปเดตตัวนับถอยหลัง
    const interval = setInterval(() => {
      checkLockStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- 2. HANDLE INPUT ---
  useEffect(() => {
    if (isLocked) return; // ถ้าล็อคอยู่ ห้ามทำอะไร

    if (pin.length === CORRECT_PIN.length) {
      if (pin === CORRECT_PIN) {
        // ✅ ถูกต้อง: ปลดล็อค + ล้างค่าความผิดพลาด
        localStorage.removeItem('pin_attempts');
        onUnlock();
      } else {
        // ❌ ผิด: เพิ่มจำนวนครั้งที่ผิด
        handleWrongAttempt();
      }
    }
  }, [pin, CORRECT_PIN, onUnlock, isLocked]);

  // --- 3. WRONG ATTEMPT LOGIC ---
  const handleWrongAttempt = () => {
    setError(true);
    
    // ดึงค่าเก่ามาบวก 1
    const currentAttempts = parseInt(localStorage.getItem('pin_attempts') || '0') + 1;
    localStorage.setItem('pin_attempts', currentAttempts.toString());

    // เช็คว่าเกินโควต้าหรือยัง?
    if (currentAttempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCK_DURATION;
      localStorage.setItem('pin_lock_until', lockUntil.toString());
      setIsLocked(true);
      setTimeLeft(LOCK_DURATION);
      setPin(''); // ล้างพิน
    } else {
      // ยังไม่ครบ 3 ครั้ง ให้โอกาสลองใหม่
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 500);
    }
  };

  const handlePress = (num: string) => {
    if (!isLocked && pin.length < CORRECT_PIN.length) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (!isLocked) setPin(prev => prev.slice(0, -1));
  };

  // Helper: แปลงเวลา ms เป็น MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- UI: LOCKED STATE ---
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center text-white px-6 text-center animate-in fade-in duration-300">
        <div className="p-6 rounded-full bg-red-500/10 text-red-500 mb-6 animate-pulse">
          <AlertTriangle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-red-500 mb-2 uppercase tracking-widest">System Locked</h2>
        <p className="text-stone-400 mb-8 max-w-xs">
          ใส่รหัสผิดเกิน {MAX_ATTEMPTS} ครั้ง เพื่อความปลอดภัยระบบถูกล็อคชั่วคราว
        </p>
        
        <div className="flex items-center gap-3 text-3xl font-mono font-bold text-[#C5A059] bg-stone-800 px-8 py-4 rounded-2xl border border-stone-700">
          <Timer className="animate-spin-slow" />
          {formatTime(timeLeft)}
        </div>
        <p className="text-stone-600 text-xs mt-4">กรุณารอจนกว่าเวลาจะหมด</p>
      </div>
    );
  }

  // --- UI: NORMAL PIN PAD ---
  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center text-white">
      
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full bg-stone-800 transition-all duration-300 ${error ? 'animate-shake bg-red-500/20 text-red-500' : 'text-[#C5A059]'}`}>
          {pin.length === CORRECT_PIN.length && !error ? <Unlock size={32}/> : <Lock size={32}/>}
        </div>
        <h2 className="text-xl font-bold tracking-widest text-stone-400">
          {error ? 'WRONG PIN' : 'SECURE ZONE'}
        </h2>
      </div>

      {/* Dots Display */}
      <div className="flex gap-4 mb-12">
        {[...Array(CORRECT_PIN.length)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              error 
                ? 'bg-red-500' 
                : i < pin.length ? 'bg-[#C5A059] scale-110 shadow-[0_0_10px_#C5A059]' : 'bg-stone-700'
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
          className="w-20 h-20 rounded-full bg-transparent text-stone-500 hover:text-red-400 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Delete size={28} />
        </button>
      </div>

      {/* Shake Animation CSS */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-15px); }
          40% { transform: translateX(15px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import PinLock from '@/app/components/PinLock';
// import IncomeExpenseComponent from ... (คอมโพเนนต์รายรับจ่ายของคุณ)

export default function PrivateMoneyPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // (Optional) เช็คว่าเคยปลดล็อคไปแล้วใน Session นี้ไหม จะได้ไม่ต้องกดบ่อย
  useEffect(() => {
    const unlocked = sessionStorage.getItem('money_unlocked');
    if (unlocked === 'true') setIsUnlocked(true);
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('money_unlocked', 'true'); // จำไว้ว่าปลดแล้วจนกว่าจะปิด browser
  };

  // ถ้ายังไม่ปลดล็อค ให้โชว์หน้า PIN บังไว้
  if (!isUnlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  // ถ้าปลดล็อคแล้ว โชว์เนื้อหาจริง
  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <h1 className="text-3xl font-black text-stone-800 mb-6">💰 My Wallet</h1>
      
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-stone-200">
        <p className="text-stone-500">ยินดีต้อนรับสู่โซนการเงินลับสุดยอด!</p>
        
        {/* ใส่ฟอร์มบันทึกรายรับรายจ่ายตรงนี้ */}
        <div className="mt-8 p-4 bg-green-100 rounded-xl text-green-800 font-bold">
           + รายรับ: 50,000 บาท
        </div>
        <div className="mt-4 p-4 bg-red-100 rounded-xl text-red-800 font-bold">
           - รายจ่าย: 200 บาท (ค่าชาบู)
        </div>

      </div>
    </div>
  );
}
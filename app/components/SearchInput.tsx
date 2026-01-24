'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State เก็บค่าที่พิมพ์
  const [text, setText] = useState(searchParams.get('q') || '');
  
  // Logic การหน่วงเวลา (Debounce) 500ms
  // เพื่อไม่ให้ค้นหาทุกตัวอักษรที่พิมพ์ (ประหยัด Supabase)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // ถ้าค่าเปลี่ยน ให้เปลี่ยน URL
      if (text !== searchParams.get('q')) {
        if (text) {
          router.push(`/?q=${text}`);
        } else {
          router.push('/'); // ถ้าลบหมด ให้กลับหน้าแรก
        }
      }
    }, 500); // รอ 0.5 วินาทีหลังหยุดพิมพ์

    return () => clearTimeout(timeoutId);
  }, [text, router, searchParams]);

  return (
    <div className="relative group">
      {/* Icon แว่นขยาย */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-stone-400 group-focus-within:text-[#C5A059] transition-colors" />
      </div>
      
      {/* Input Field */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search posts..."
        className="pl-10 pr-4 py-2 bg-stone-100 border-none rounded-full text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 w-[150px] focus:w-[250px] transition-all duration-300"
      />
    </div>
  );
}
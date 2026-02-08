'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/libs/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  LogOut, 
  HardDrive, 
  Camera,     
  Menu,      // 👈 ไอคอน 3 ขีด
  X          // 👈 ไอคอน ปิด
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  // State สำหรับเปิด/ปิดเมนูในมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'All Posts', href: '/admin/posts', icon: <FileText size={20} /> },
    { name: 'Create Post', href: '/admin/create', icon: <PlusCircle size={20} /> },
    { name: 'Media Library', href: '/admin/media', icon: <HardDrive size={20} /> },
    { name: 'Memories', href: '/admin/gallery', icon: <Camera size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col md:flex-row font-sans">
      
      {/* =========================================
          1. MOBILE HEADER (โชว์เฉพาะมือถือ)
      ========================================= */}
      <div className="md:hidden bg-[#1C1917] text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex flex-col">
           <span className="text-lg font-black tracking-tight uppercase">Admin Panel</span>
           <span className="text-[9px] font-bold text-[#C5A059] tracking-widest uppercase">Scale & Skill</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} /> {/* 👈 3 ขีด */}
        </button>
      </div>

      {/* =========================================
          2. OVERLAY (ฉากหลังมืดๆ เวลากดเมนู)
      ========================================= */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* =========================================
          3. SIDEBAR (เมนูด้านซ้าย)
      ========================================= */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#1C1917] border-r border-stone-800 shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        flex flex-col
      `}>
        
        {/* Header (Logo + Close Button) */}
        <div className="h-20 md:h-24 flex items-center justify-between px-6 border-b border-stone-800/50">
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Admin</span>
            <span className="text-[10px] font-bold text-[#C5A059] tracking-[0.2em] uppercase mt-1">
              Scale & Skill
            </span>
          </div>
          {/* ปุ่มปิด (เฉพาะมือถือ) */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-stone-500 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)} // กดแล้วปิดเมนูทันที
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group
                  ${isActive 
                    ? 'bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/20 translate-x-1' 
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white hover:translate-x-1'}
                `}
              >
                <span className={isActive ? 'text-white' : 'text-stone-500 group-hover:text-[#C5A059] transition-colors'}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Area */}
        <div className="p-4 border-t border-stone-800/50 bg-[#1C1917]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* =========================================
          4. MAIN CONTENT (เนื้อหาขวา)
      ========================================= */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full">
        {children}
      </main>

    </div>
  );
}
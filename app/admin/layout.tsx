'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // 👈 1. เรียกใช้ usePathname
import { createClient } from '@/libs/supabase';
import { LayoutDashboard, FileText, Settings, LogOut, ExternalLink, PenSquare } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // 👈 2. ดึง URL ปัจจุบันมาเก็บไว้
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // 👈 3. ฟังก์ชันช่วยเช็คว่า "เมนูนี้ Active อยู่ไหม?"
  const isActive = (path: string) => {
    // ถ้า path ตรงกันเป๊ะ หรือ เป็นลูกของ path นั้น (เช่น /admin/posts/123 ก็ถือว่าอยู่ใน /admin/posts)
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F4] font-sans">
      
      {/* --- ADMIN SIDEBAR --- */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col fixed h-full z-20 border-r border-stone-800 shadow-xl">
        
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-white font-bold tracking-tight">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#C5A059] to-[#8A6E3E] flex items-center justify-center text-xs shadow-lg shadow-[#C5A059]/20">S</div>
            <span className="text-sm tracking-widest">ADMIN PANEL</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          <p className="px-3 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2 mt-2">Main Menu</p>

          <Link 
            href="/admin/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive('/admin/dashboard') 
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/20' // ✨ สีตอน Active
                : 'hover:bg-stone-800 hover:text-stone-200'               // สีปกติ
              }`}
          >
            <LayoutDashboard size={18} className={isActive('/admin/dashboard') ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'} /> 
            Dashboard
          </Link>

          <Link 
            href="/admin/create" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive('/admin/create') 
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/20' 
                : 'hover:bg-stone-800 hover:text-stone-200'
              }`}
          >
            <PenSquare size={18} className={isActive('/admin/create') ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'} /> 
            New Post
          </Link>

          <Link 
            href="/admin/posts" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive('/admin/posts') 
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/20' 
                : 'hover:bg-stone-800 hover:text-stone-200'
              }`}
          >
            <FileText size={18} className={isActive('/admin/posts') ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'} /> 
            All Posts
          </Link>

          <p className="px-3 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2 mt-6">System</p>

          <Link 
            href="/admin/settings" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive('/admin/settings') 
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/20' 
                : 'hover:bg-stone-800 hover:text-stone-200'
              }`}
          >
            <Settings size={18} className={isActive('/admin/settings') ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'} /> 
            Settings
          </Link>

        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-900">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-stone-800 text-stone-400 hover:text-white transition-colors mb-1">
            <ExternalLink size={16} /> View Live Site
          </Link>
          
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors w-full text-left"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
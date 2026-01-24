'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react'; // ❌ ลบ Search ออกจากตรงนี้
import Image from 'next/image';
import SearchInput from '@/app/components/SearchInput'; // 👈 1. นำเข้า Component Search

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- CASE 1: หน้า ABOUT ---
  if (pathname === '/about') {
    return (
      <nav className="fixed top-0 w-full z-50 h-20 flex items-center mix-blend-difference text-white pointer-events-none">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="text-sm font-bold tracking-widest uppercase">Back</span>
          </Link>
          <div className="w-10"></div>
        </div>
      </nav>
    );
  }

  // --- CASE 2: หน้า BLOG DETAIL ---
  if (pathname.startsWith('/blog/')) {
    return (
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-stone-100 z-50 h-16 flex items-center">
        <div className="max-w-4xl mx-auto w-full px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-[#C5A059] transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="text-sm font-medium">Back</span>
          </Link>
          
          <div className="text-sm font-bold text-stone-800 tracking-tight uppercase opacity-50 hidden md:block">
            Scale & Skill
          </div>

          <div className="flex gap-3 text-stone-400">
            <button className="hover:text-[#C5A059] transition-colors"><Bookmark size={20} /></button>
            <button className="hover:text-[#C5A059] transition-colors"><Share2 size={20} /></button>
          </div>
        </div>
      </nav>
    );
  }

  // --- HIDE NAVBAR CONDITIONS ---
  if (pathname === '/login' || pathname === '/admin/create' || pathname === '/admin/posts' || pathname === '/admin/dashboard') {
    return null;
  }

  // --- CASE 3: MAIN NAVBAR (HOME & OTHERS) ---
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <nav className={`
        pointer-events-auto
        flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300
        ${scrolled 
          ? 'w-full max-w-5xl bg-white/90 backdrop-blur-md shadow-lg shadow-stone-200/50 border border-white/40' 
          : 'w-full max-w-6xl bg-transparent'}
      `}>
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="flex items-center gap-3 group cursor-pointer pl-2"> 
            <div className="relative w-[3.25rem] h-[3.25rem] shadow-lg shadow-[#C5A059]/20 rounded-full overflow-hidden transform group-hover:scale-110 transition-all duration-300 bg-white">
              <Image
                src="/images/logo.png"
                alt="Scale & Skill Crocodile Logo"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-stone-800 tracking-tight leading-none uppercase font-sans">
              Scale & Skill
            </span>
            <span className="text-[0.6rem] font-bold text-[#C5A059] tracking-widest uppercase leading-tight">
              Body & Mind Dev.
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-sm font-medium transition-colors relative group ${pathname === '/' ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'}`}>
            Home
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#C5A059] transition-all ${pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
          </Link>
          <Link href="/about" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C5A059] transition-all group-hover:w-full"></span>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          
          {/* 👇 2. แทนที่ปุ่มแว่นขยายเดิม ด้วย SearchInput Component */}
          <SearchInput />

          <Link href="/login" className="hidden md:block px-5 py-2 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-[#C5A059] transition-all hover:scale-105 hover:shadow-md">
            Login
          </Link>
        </div>
      </nav>
    </div>
  );
}
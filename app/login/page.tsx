'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // เพิ่ม router
import { createClient } from '@/libs/supabase'; // เพิ่ม supabase client
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'; // เพิ่ม icon

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- States ---
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Login สำเร็จ -> ไปหน้า Admin
      router.push('/admin/create');
      router.refresh(); // รีเฟรชเพื่อให้ Server Component รู้ว่า Login แล้ว

    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAF9] font-sans selection:bg-[#C5A059]/30">
      
      {/* --- LEFT SIDE: BRAND VISUAL (เหมือนเดิม) --- */}
      <div className="hidden md:flex w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059] rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#C5A059] to-[#8A6E3E] flex items-center justify-center font-black text-sm">S</div>
          <span className="font-bold tracking-tight uppercase">Scale & Skill</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-serif italic leading-tight mb-6 text-stone-200">
            "Discipline is the bridge between goals and accomplishment."
          </h2>
          <p className="text-[#C5A059] font-bold uppercase tracking-widest text-xs">
            Jim Rohn
          </p>
        </div>

        <div className="relative z-10 text-stone-500 text-xs">
          © 2024 Scale & Skill. All rights reserved.
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* Back Button */}
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors text-sm font-medium group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
          Back to Home
        </Link>

        <div className="w-full max-w-sm space-y-8">
          
          {/* Form Header */}
          <div className="text-center">
            <div className="md:hidden w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8A6E3E] flex items-center justify-center font-black text-2xl text-white">S</div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-stone-500">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form Inputs */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-stone-600 uppercase mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-stone-400 group-focus-within:text-[#C5A059] transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-lg bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all sm:text-sm disabled:opacity-50 disabled:bg-stone-50"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-stone-600 uppercase">Password</label>
                {/* <div className="text-sm">
                  <a href="#" className="font-medium text-[#C5A059] hover:text-[#a08246]">Forgot password?</a>
                </div> */}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-stone-400 group-focus-within:text-[#C5A059] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-stone-200 rounded-lg bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all sm:text-sm disabled:opacity-50 disabled:bg-stone-50"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 animate-in slide-in-from-top-1">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#C5A059] focus:ring-[#C5A059] border-stone-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-stone-900 hover:bg-[#C5A059] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
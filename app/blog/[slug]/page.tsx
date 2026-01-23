'use client';

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@/libs/supabase'; // ⚠️ เช็ค path ว่าเป็น 'lib' หรือ 'libs' ตามโปรเจกต์ของคุณ
import { 
  ArrowLeft, Share2, Bookmark, Dumbbell, BookOpen, 
  Star, Zap, Terminal, Loader2, Calendar 
} from 'lucide-react';
import Link from 'next/link';

// --- 1. HELPER: ฟังก์ชันแกะ Hashtag ---
const extractTags = (htmlContent: string) => {
  if (!htmlContent) return [];
  
  // ลบ HTML Tags ออกให้เหลือแต่ Text เพื่อกันความผิดพลาด
  const text = htmlContent.replace(/<[^>]+>/g, ' ');
  
  // Regex จับคำที่ขึ้นต้นด้วย # (รองรับภาษาไทย, อังกฤษ, ตัวเลข, _)
  const regex = /#[\w\u0E00-\u0E7F]+/g;
  const matches = text.match(regex);
  
  // ตัด # ตัวหน้าออก และลบคำซ้ำ (Unique)
  return matches ? Array.from(new Set(matches.map(tag => tag.slice(1)))) : [];
};

// --- 2. COMPONENT: Meta Info Box ---
const MetaInfoBox = ({ post }: { post: any }) => {
  const catSlug = post.categories?.slug || '';
  
  const isWorkout = catSlug.includes('workout') || catSlug.includes('fit') || catSlug.includes('calisthenics');
  const isBook = catSlug.includes('book') || catSlug.includes('read');
  const isCode = catSlug.includes('code') || catSlug.includes('dev');

  if (!post.meta_data) return null;

  return (
    <div className="my-8 p-6 bg-white rounded-2xl border border-stone-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        {isWorkout && <><Dumbbell size={16}/> Workout Details</>}
        {isBook && <><BookOpen size={16}/> Book Info</>}
        {isCode && <><Terminal size={16}/> Tech Stack</>}
        {!isWorkout && !isBook && !isCode && <>Details</>}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Workout Meta */}
        {isWorkout && (
          <>
            <div><p className="text-xs text-stone-500 mb-1">Level</p><p className="font-bold text-stone-800 flex items-center gap-1"><Zap size={14} className="text-[#C5A059]" /> {post.meta_data.difficulty}</p></div>
            <div><p className="text-xs text-stone-500 mb-1">Calories</p><p className="font-bold text-stone-800">{post.meta_data.calories || '-'}</p></div>
            <div><p className="text-xs text-stone-500 mb-1">Views</p><p className="font-bold text-stone-800">{post.meta_data.views || 0}</p></div>
          </>
        )}

        {/* Book Meta */}
        {isBook && (
          <>
            <div><p className="text-xs text-stone-500 mb-1">Author</p><p className="font-bold text-stone-800">{post.meta_data.author || '-'}</p></div>
            <div><p className="text-xs text-stone-500 mb-1">Rating</p><p className="font-bold text-stone-800 flex items-center gap-1"><Star size={14} className="fill-[#C5A059] text-[#C5A059]" /> {post.meta_data.rating || 0}/5</p></div>
            <div><p className="text-xs text-stone-500 mb-1">Difficulty</p><p className="font-bold text-stone-800">{post.meta_data.difficulty}</p></div>
          </>
        )}

        {/* Code Meta */}
        {isCode && (
          <>
             <div className="col-span-2"><p className="text-xs text-stone-500 mb-1">Repository</p>
                {post.meta_data.github_url ? (
                  <a href={post.meta_data.github_url} target="_blank" className="font-bold text-[#C5A059] hover:underline truncate block">GitHub Link ↗</a>
                ) : <span className="text-stone-400">-</span>}
             </div>
             <div><p className="text-xs text-stone-500 mb-1">Difficulty</p><p className="font-bold text-stone-800">{post.meta_data.difficulty}</p></div>
          </>
        )}

        {/* Default Meta */}
        {!isWorkout && !isBook && !isCode && (
           <div><p className="text-xs text-stone-500 mb-1">Difficulty</p><p className="font-bold text-stone-800">{post.meta_data?.difficulty || 'General'}</p></div>
        )}
      </div>
    </div>
  );
};

// --- 3. MAIN PAGE ---
export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // แกะ Params (รองรับ Next.js 15)
  const { slug } = use(params);

  const supabase = createClient();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล Post
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`*, categories (name, slug)`)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
      } else {
        setPost(data);

        // Increment Views (บวกยอดวิวทีละ 1)
        const currentViews = data.meta_data?.views || 0;
        const newMetaData = { ...data.meta_data, views: currentViews + 1 };
        
        await supabase
          .from('posts')
          .update({ meta_data: newMetaData })
          .eq('id', data.id);
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  // เตรียม Tags (ถ้าโหลดเสร็จแล้วให้แกะ tags ออกมา)
  const tags = post ? extractTags(post.content) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] text-stone-500 gap-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link href="/" className="text-[#C5A059] hover:underline">Go back home</Link>
      </div>
    );
  }

  // เช็คประเภทเพื่อเปลี่ยนสี Badge ด้านบน
  const isWorkout = post.categories?.slug?.includes('workout');
  const isBook = post.categories?.slug?.includes('book');
  const isCode = post.categories?.slug?.includes('code');

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans selection:bg-[#C5A059]/30">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-stone-100 z-50 h-16 flex items-center transition-all duration-300">
        <div className="max-w-4xl mx-auto w-full px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-[#C5A059] transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
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

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <article className="max-w-3xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`
                px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${isWorkout ? 'bg-rose-50 text-rose-600' : isBook ? 'bg-teal-50 text-teal-600' : isCode ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-100 text-stone-600'}
              `}>
                {post.categories?.name || 'Article'}
              </span>
              <span className="text-stone-300 text-xs">•</span>
              <span className="text-stone-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> {new Date(post.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 leading-tight mb-6">
              {post.title}
            </h1>
          </div>

          {/* Hero Image */}
          <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-lg mb-10 bg-stone-100 animate-in fade-in zoom-in duration-700 delay-100">
            {post.cover_image ? (
               <img 
                src={post.cover_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">No Cover Image</div>
            )}
          </div>

          {/* Dynamic Meta Info */}
          <MetaInfoBox post={post} />

          {/* Content Body */}
          <div className="prose prose-lg prose-stone max-w-none 
            prose-headings:font-bold prose-headings:text-stone-900 
            prose-p:text-stone-600 prose-p:leading-loose prose-p:font-serif
            prose-a:text-[#C5A059] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-stone-800
            prose-li:text-stone-600
            prose-img:rounded-xl prose-img:shadow-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
            
          </div>

          {/* 👇 Tags Section (Auto Generated from #Hashtags) */}
          {tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-4 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-500 hover:border-[#C5A059] hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="my-12 h-px bg-stone-200 w-full"></div>

          {/* Newsletter */}
          {/* <div className="bg-stone-900 rounded-3xl p-8 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">ไม่พลาดเทคนิคดีๆ แบบนี้</h3>
              <p className="text-stone-400 mb-6 text-sm">รับบทความใหม่ส่งตรงถึงอีเมลของคุณทุกสัปดาห์ (ฟรี)</p>
              <div className="flex max-w-sm mx-auto gap-2">
                <input 
                  type="email" placeholder="Your email address" 
                  className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A059]"
                />
                <button className="px-6 py-2 bg-[#C5A059] hover:bg-[#b08d4b] text-white font-bold rounded-full text-sm transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#C5A059] rounded-full opacity-10 blur-3xl"></div>
          </div> */}

        </article>
      </main>

    </div>
  );
}
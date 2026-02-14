'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/libs/supabase';
import { BookOpen, Dumbbell, Star, ChevronRight, Terminal, Clock, Loader2 } from 'lucide-react';

// --- 1. POST CARD COMPONENT ---
// แสดงผลการ์ดแต่ละใบ โดยเปลี่ยน icon ตามหมวดหมู่
const PostCard = ({ post }: { post: any }) => {
  const categorySlug = post.categories?.slug || '';
  
  // เช็คประเภทเพื่อเลือก icon/สี
  const isWorkout = categorySlug.includes('workout') || categorySlug.includes('calisthenics') || categorySlug.includes('fit');
  const isCode = categorySlug.includes('code') || categorySlug.includes('dev') || categorySlug.includes('program');
  const isBook = categorySlug.includes('book') || categorySlug.includes('read');

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <div className="group relative bg-white rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full flex flex-col">
        
        {/* Image Cover */}
        <div className="relative h-64 overflow-hidden rounded-[1.5rem] flex-shrink-0 bg-stone-100">
          {post.cover_image ? (
            <img 
              src={post.cover_image} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">No Image</div>
          )}
          
          {/* Badge มุมขวาบน */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm z-10">
            {isWorkout && <span className="text-rose-500 flex items-center gap-1"><Dumbbell size={12}/> Workout</span>}
            {isCode && <span className="text-indigo-600 flex items-center gap-1"><Terminal size={12}/> Programming</span>}
            {isBook && <span className="text-teal-600 flex items-center gap-1"><BookOpen size={12}/> Book</span>}
            {!isWorkout && !isCode && !isBook && <span className="text-stone-500">{post.categories?.name}</span>}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 pt-5 flex flex-col flex-grow">
          {/* Meta Top: Date | Difficulty */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              {new Date(post.created_at).toLocaleDateString('en-GB')}
            </span>
            <div className="h-px w-4 bg-stone-200"></div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              {post.meta_data?.difficulty || post.meta_data?.author || 'General'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-stone-800 mb-3 leading-tight group-hover:text-[#C5A059] transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed mb-6 font-light flex-grow">
            {post.excerpt}
          </p>

          {/* Bottom Meta & Arrow */}
          <div className="flex items-center justify-between border-t border-stone-50 pt-4 mt-auto">
            <div className="flex items-center gap-2">
              {/* แสดงข้อมูลเฉพาะตามหมวดหมู่ */}
              {post.meta_data?.duration && (
                <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Clock size={12} /> {post.meta_data.duration}
                </span>
              )}
              {post.meta_data?.rating && (
                <span className="bg-teal-50 text-teal-600 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Star size={12} className="fill-teal-600" /> {post.meta_data.rating}
                </span>
              )}
               {post.meta_data?.tech_stack && (
                <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 truncate max-w-[120px]">
                  <Terminal size={12} /> {post.meta_data.tech_stack.split(',')[0]}
                </span>
              )}
              {!post.meta_data?.duration && !post.meta_data?.rating && !post.meta_data?.tech_stack && (
                 <span className="text-xs text-stone-400 font-medium">Read Article</span>
              )}
            </div>
            
            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-[#C5A059] group-hover:text-white transition-all">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- 2. HOME CONTENT LOGIC ---
// แยกส่วน Logic ออกมาเพื่อห่อด้วย Suspense
const HomeContent = () => {
  const supabase = createClient();
  
  // รับค่า Search Query จาก URL (Case Insensitive)
  const searchParams = useSearchParams();
  const queryText = (searchParams.get('q') || '').toLowerCase();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`*, categories (name, slug)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []); 

  // Filter Logic (Tabs + Search Text)
  const filteredPosts = posts.filter(post => {
    // 1. Check Tab
    const catSlug = post.categories?.slug || '';
    const matchesTab = filter === 'all' || catSlug.includes(filter);

    // 2. Check Search Text (Title, Excerpt, Category Name)
    const catName = post.categories?.name || '';
    const matchesSearch = queryText === '' || 
                          post.title.toLowerCase().includes(queryText) || 
                          (post.excerpt || '').toLowerCase().includes(queryText) ||
                          catName.toLowerCase().includes(queryText);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans selection:bg-[#C5A059]/20 selection:text-[#8A6E3E]">
      
      {/* --- HERO SECTION --- */}
      <section className="pt-44 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white border border-[#C5A059]/20 shadow-sm text-xs font-bold text-[#C5A059] tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
              JS Family Blog
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-stone-900 mb-8 tracking-tight leading-[1.1] uppercase animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            BODY  <span className="text-[#C5A059]">&</span> MIND MASTERY
          </h1>

          <div className="mb-10 flex flex-col gap-3 items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <h2 className="text-xl md:text-3xl font-medium text-stone-600 font-serif tracking-wide italic">
              "สงบ... เพื่อมองเห็นโอกาส"
            </h2>
            <h2 className="text-xl md:text-3xl font-black text-[#C5A059] uppercase tracking-wider drop-shadow-sm">
              "ทรงพลัง... เพื่อคว้าชัยชนะ"
            </h2>
          </div>

          <p className="text-lg text-stone-500 max-w-xl mx-auto mb-10 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
            "วิถีแห่งผู้ชนะไม่ได้วัดกันที่ความเร็ว  <br className="hidden md:block"/>
            แต่คือความมั่นคงของ <span className="font-medium text-stone-700"> จิตใจ </span> และ <span className="font-medium text-stone-700"> พละกำลัง </span> ที่ผ่านการฝึกฝนอย่างประณีต"
          </p>
          
          {/* Filter Tabs */}
          <div className="flex justify-center animate-in fade-in zoom-in duration-500 delay-500">
            <div className="inline-flex flex-wrap justify-center gap-1 p-1.5 bg-white rounded-full shadow-sm border border-stone-100">
              {[
                { id: 'all', label: 'All Stories' },
                { id: 'calisthenics', label: 'Workout' }, 
                { id: 'read', label: 'Library' },         
                { id: 'code', label: 'Programming' }      
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`
                    px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                    ${filter === tab.id 
                      ? 'bg-stone-900 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT GRID --- */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        
        {/* Search Result Header */}
        {queryText && !loading && (
           <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-2">
             <h2 className="text-xl font-bold text-stone-800">
               Search results for: <span className="text-[#C5A059]">"{queryText}"</span>
             </h2>
             <button 
               onClick={() => window.location.href = '/'} 
               className="mt-2 text-xs text-stone-400 hover:text-[#C5A059] underline"
             >
               Clear Search
             </button>
           </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
            <Loader2 size={40} className="animate-spin text-[#C5A059]" />
            <p>Loading inspiration...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20 opacity-50 border-2 border-dashed border-stone-200 rounded-3xl mx-auto max-w-lg">
            <p className="text-stone-400">
              {queryText 
                ? `No stories found matching "${queryText}".` 
                : "No stories found in this category yet."}
            </p>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-stone-200 mx-8">
        <p className="text-stone-400 text-sm font-medium">
          © {new Date().getFullYear()} Family JS. Body & Mind Development.
        </p>
      </footer>
    </div>
  );
};

// --- 3. EXPORT DEFAULT (Wrapped in Suspense) ---
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <Loader2 size={40} className="animate-spin text-[#C5A059]" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
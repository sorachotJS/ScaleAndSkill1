'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/libs/supabase';
import { BookOpen, Dumbbell, Star, ChevronRight, Terminal, Clock, Loader2, LayoutGrid } from 'lucide-react';

// --- 1. POST CARD COMPONENT ---
const PostCard = ({ post }: { post: any }) => {
  const categorySlug = post.categories?.slug || '';
  
  const isWorkout = categorySlug.includes('workout') || categorySlug.includes('calisthenics') || categorySlug.includes('fit');
  const isCode = categorySlug.includes('code') || categorySlug.includes('dev') || categorySlug.includes('program');
  const isBook = categorySlug.includes('book') || categorySlug.includes('read');

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <div className="group relative bg-white rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full flex flex-col">
        
        <div className="relative h-64 overflow-hidden rounded-[1.5rem] flex-shrink-0 bg-stone-100">
          {post.cover_image ? (
            <img 
              src={post.cover_image} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 font-medium">No Cover Image</div>
          )}
          
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm z-10">
            {isWorkout && <span className="text-rose-500 flex items-center gap-1"><Dumbbell size={12}/> Workout</span>}
            {isCode && <span className="text-indigo-600 flex items-center gap-1"><Terminal size={12}/> Programming</span>}
            {isBook && <span className="text-teal-600 flex items-center gap-1"><BookOpen size={12}/> Book</span>}
            {!isWorkout && !isCode && !isBook && <span className="text-stone-500">{post.categories?.name}</span>}
          </div>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-grow">
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

          <div className="flex items-center justify-between border-t border-stone-50 pt-4 mt-auto">
            <div className="flex items-center gap-2">
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
const HomeContent = () => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const queryText = (searchParams.get('q') || '').toLowerCase();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // สำหรับเก็บหมวดหมู่จาก Supabase
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch Categories & Posts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. ดึงข้อมูลหมวดหมู่
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      
      setCategories(catData || []);

      // 2. ดึงข้อมูลโพสต์
      const { data: postData, error } = await supabase
        .from('posts')
        .select(`*, categories (name, slug)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(postData || []);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [supabase]); 

  // Filter Logic
  const filteredPosts = posts.filter(post => {
    const catSlug = post.categories?.slug || '';
    const matchesTab = filter === 'all' || catSlug === filter;

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
            BODY <span className="text-[#C5A059]">&</span> MIND MASTERY
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
            "วิถีแห่งผู้ชนะไม่ได้วัดกันที่ความเร็ว <br className="hidden md:block"/>
            แต่คือความมั่นคงของ <span className="font-medium text-stone-700"> จิตใจ </span> และ <span className="font-medium text-stone-700"> พละกำลัง </span> ที่ผ่านการฝึกฝนอย่างประณีต"
          </p>
          
          {/* Dynamic Filter Tabs */}
          <div className="flex justify-center animate-in fade-in zoom-in duration-500 delay-500 overflow-x-auto pb-4 no-scrollbar">
            <div className="inline-flex gap-1 p-1.5 bg-white rounded-full shadow-sm border border-stone-100 min-w-max">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filter === 'all' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <LayoutGrid size={14} /> All Stories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.slug)}
                  className={`
                    px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                    ${filter === cat.slug 
                      ? 'bg-stone-900 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT GRID --- */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        
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
            <p className="font-medium tracking-wide">Syncing with Family JS Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-24 border-2 border-dashed border-stone-200 rounded-[3rem] mx-auto max-w-lg bg-white/50 backdrop-blur-sm">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                <LayoutGrid size={24} />
            </div>
            <p className="text-stone-500 font-medium px-6 leading-relaxed">
              {queryText 
                ? `The hunter's search for "${queryText}" yielded no results. Try another keyword.` 
                : "This chapter is yet to be written. Please check back later."}
            </p>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-stone-200 mx-8">
        <p className="text-stone-400 text-sm font-medium tracking-wide">
          © {new Date().getFullYear()} Family JS. <br className="md:hidden"/>
          Body & Mind Development.
        </p>
      </footer>
    </div>
  );
};

// --- 3. EXPORT DEFAULT ---
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
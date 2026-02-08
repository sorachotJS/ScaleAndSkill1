'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/libs/supabase';
import { 
  BarChart3, Eye, FileText, Layers, 
  ArrowUpRight, Calendar, Loader2, Plus,
  Image as ImageIcon, HardDrive // 👈 เพิ่ม icon HardDrive
} from 'lucide-react';

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // เก็บข้อมูลสถิติ
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalCategories: 0,
    totalGallery: 0,
    totalGallerySize: '0.00',
    totalMedia: 0,           // 👈 เพิ่มจำนวน Media
    totalMediaSize: '0.00'   // 👈 เพิ่มขนาด Media
  });

  const [categoryStats, setCategoryStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // 1. Posts
        const { data: allPosts, error: postsError } = await supabase
          .from('posts')
          .select('id, category_id, meta_data, created_at, title, slug, categories(name)')
          .order('created_at', { ascending: false });

        // 2. Categories
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        // 3. Gallery (Database & Storage)
        const { count: galleryCount } = await supabase
          .from('gallery')
          .select('*', { count: 'exact', head: true });
          
        const { data: galleryFiles } = await supabase.storage
            .from('gallery') // Bucket: gallery
            .list('', { limit: 1000 });

        // 4. 📸 Media Library (Storage Only)
        // ดึงไฟล์จาก Bucket 'images' ในโฟลเดอร์ 'library'
        const { data: mediaFiles } = await supabase.storage
            .from('images') // Bucket: images
            .list('library', { limit: 1000 });

        if (postsError) throw new Error('Failed to fetch data');

        // --- Calculation ---
        const postCount = allPosts?.length || 0;
        const viewCount = allPosts?.reduce((sum : number, post: any) => sum + (post.meta_data?.views || 0), 0) || 0;

        // Calc Gallery Size
        let galleryBytes = 0;
        galleryFiles?.forEach((file) => galleryBytes += file.metadata?.size || 0);
        const galleryMB = (galleryBytes / (1024 * 1024)).toFixed(2);

        // Calc Media Size 👈
        let mediaBytes = 0;
        let mediaCount = 0;
        if (mediaFiles) {
             // กรองเฉพาะไฟล์ (ไม่นับโฟลเดอร์ว่าง)
             const filesOnly = mediaFiles.filter(f => f.name !== '.emptyFolderPlaceholder');
             mediaCount = filesOnly.length;
             filesOnly.forEach((file) => mediaBytes += file.metadata?.size || 0);
        }
        const mediaMB = (mediaBytes / (1024 * 1024)).toFixed(2);


        // Category Mix
        const catMap = new Map();
        allPosts?.forEach((post: any) => {
            let catName = 'Uncategorized';
            if (Array.isArray(post.categories) && post.categories.length > 0) catName = post.categories[0].name;
            else if (post.categories?.name) catName = post.categories.name;
            catMap.set(catName, (catMap.get(catName) || 0) + 1);
        });

        const catStatsArray = Array.from(catMap.entries()).map(([name, count]) => ({
            name, count, percent: Math.round((count / postCount) * 100) || 0
        })).sort((a, b) => b.count - a.count);

        setStats({
          totalPosts: postCount,
          totalViews: viewCount,
          totalCategories: catCount || 0,
          totalGallery: galleryCount || 0,
          totalGallerySize: galleryMB,
          totalMedia: mediaCount,
          totalMediaSize: mediaMB
        });
        
        setCategoryStats(catStatsArray);
        setRecentPosts(allPosts?.slice(0, 5) || []); 

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-stone-400 gap-2">
        <Loader2 className="animate-spin" /> Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">Dashboard</h1>
          <p className="text-stone-500">Overview of your content and storage.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-stone-500 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
          <Calendar size={16} className="text-[#C5A059]" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* STATS CARDS (เพิ่มเป็น 5 ช่อง หรือจัด Grid ใหม่) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Link href="/admin/posts">
            <StatCard 
            title="Total Posts" 
            value={stats.totalPosts} 
            icon={<FileText size={24} className="text-white" />}
            color="bg-stone-800"
            subtext="All published articles"
            />
        </Link>
        
        <div className="cursor-default">
            <StatCard 
            title="Total Views" 
            value={stats.totalViews.toLocaleString()} 
            icon={<Eye size={24} className="text-white" />}
            color="bg-[#C5A059]"
            subtext="Across all content"
            />
        </div>

        <div className="cursor-default">
            <StatCard 
            title="Categories" 
            value={stats.totalCategories} 
            icon={<Layers size={24} className="text-stone-600" />}
            color="bg-stone-200"
            textColor="text-stone-800"
            subtext="Active topics"
            />
        </div>

        {/* Gallery Card */}
        <Link href="/admin/gallery">
            <StatCard 
            title="Memories" 
            value={stats.totalGallery} 
            icon={<ImageIcon size={24} className="text-white" />}
            color="bg-rose-500"
            subtext={`~${stats.totalGallerySize} MB used`}
            />
        </Link>

        {/* 👇 Media Library Card (ใหม่) */}
        <Link href="/admin/media">
            <StatCard 
            title="Media Lib" 
            value={stats.totalMedia} 
            icon={<HardDrive size={24} className="text-white" />}
            color="bg-violet-500" // สีม่วง
            subtext={`~${stats.totalMediaSize} MB used`}
            />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <ArrowUpRight size={20} className="text-[#C5A059]" /> Recent Activity
            </h2>
            <Link href="/admin/posts" className="text-xs font-bold text-stone-500 hover:text-[#C5A059] transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <div className="text-center text-stone-400 py-10">No posts yet.</div>
            ) : (
              recentPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-stone-400 flex items-center gap-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">
                    <Eye size={12} /> {post.meta_data?.views || 0}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Link href="/admin/create" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-[#C5A059] hover:text-[#C5A059] transition-all font-bold text-sm">
                <Plus size={16} /> New Post
            </Link>
            <Link href="/admin/media" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-violet-500 hover:text-violet-500 transition-all font-bold text-sm">
                <HardDrive size={16} /> Upload Media
            </Link>
          </div>
        </div>

        {/* CATEGORY STATS */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-[#C5A059]" /> Content Mix
          </h2>
          <div className="space-y-5">
            {categoryStats.map((cat, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs font-bold text-stone-600 mb-1">
                  <span>{cat.name}</span>
                  <span>{cat.count}</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-800 rounded-full" style={{ width: `${cat.percent}%`, opacity: 0.8 }}></div>
                </div>
              </div>
            ))}
             {categoryStats.length === 0 && <div className="text-center text-stone-400 text-sm">No data available</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor = "text-white", subtext }: any) {
  return (
    <div className={`${color} rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 h-full`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider opacity-80 ${textColor}`}>{title}</p>
          <h3 className={`text-3xl font-black mt-2 ${textColor}`}>{value}</h3>
          <p className={`text-xs mt-2 opacity-70 ${textColor}`}>{subtext}</p>
        </div>
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
          {icon}
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transform scale-150 pointer-events-none">
        {icon}
      </div>
    </div>
  );
}
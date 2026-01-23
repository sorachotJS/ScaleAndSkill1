'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/libs/supabase';
import { Edit, Trash2, Plus, Search, Loader2, Calendar, Eye, FileText } from 'lucide-react';

// สร้าง Interface ให้ตรงกับข้อมูลจริง
interface Post {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  cover_image: string | null;
  categories: {
    name: string;
  } | null; // Join มาจากตาราง categories
  meta_data: {
    views?: number;
    difficulty?: string;
    [key: string]: any;
  } | null;
}

export default function AllPostsPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. ดึงข้อมูล Posts + Join Categories
  const fetchPosts = async () => {
    setLoading(true);
    
    // select(*, categories(name)) คือการบอกว่า "เอาข้อมูล Post ทั้งหมด และขอชื่อ Category มาด้วย"
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        categories (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      // Cast type ให้ตรงกับ Interface
      setPosts(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 2. ฟังก์ชันลบ Post
  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this post? This action cannot be undone.')) return;

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      alert(`Error deleting: ${error.message}`);
    } else {
      // ลบออกจาก State หน้าจอทันที (ไม่ต้องโหลดใหม่)
      setPosts(posts.filter((post) => post.id !== id));
    }
  };

  // 3. ฟังก์ชันกรองการค้นหา
  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- UI Render ---
  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">All Posts</h1>
          <p className="text-stone-500">Manage and organize your content.</p>
        </div>
        <Link 
          href="/admin/create" 
          className="flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#C5A059] transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> Create New
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-6 flex items-center gap-3">
        <Search size={20} className="text-stone-400" />
        <input 
          type="text"
          placeholder="Search posts by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-stone-700 placeholder-stone-400"
        />
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-stone-50 border-b border-stone-200 p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">
          <div className="col-span-6 md:col-span-5">Title</div>
          <div className="col-span-3 hidden md:block">Category</div>
          <div className="col-span-3 md:col-span-2">Stats</div>
          <div className="col-span-3 md:col-span-2 text-right">Actions</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 flex justify-center text-stone-400 gap-2">
            <Loader2 className="animate-spin" /> Loading posts...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPosts.length === 0 && (
          <div className="p-12 text-center text-stone-400 flex flex-col items-center">
            <div className="bg-stone-100 p-4 rounded-full mb-3">
              <FileText size={32} />
            </div>
            <p>No posts found.</p>
          </div>
        )}

        {/* Post List */}
        {!loading && filteredPosts.map((post) => (
          <div 
            key={post.id} 
            className="grid grid-cols-12 p-4 items-center border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors group"
          >
            
            {/* 1. Title & Meta */}
            <div className="col-span-6 md:col-span-5 pr-4">
              <div className="font-bold text-stone-800 text-lg leading-tight truncate">
                {post.title}
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(post.created_at).toLocaleDateString('en-GB')}
                </span>
                {/* แสดง Difficulty ถ้ามี */}
                {post.meta_data?.difficulty && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                    ${post.meta_data.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' : ''}
                    ${post.meta_data.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-600' : ''}
                    ${post.meta_data.difficulty === 'Advanced' ? 'bg-red-100 text-red-600' : ''}
                  `}>
                    {post.meta_data.difficulty}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Category Badge */}
            <div className="col-span-3 hidden md:flex items-center">
              <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold border border-stone-200">
                {/* ถ้า categories เป็น Array ให้ดึงตัวแรก ถ้าเป็น Object ให้ดึง name */}
                {Array.isArray(post.categories) 
                  ? post.categories[0]?.name 
                  : (post.categories as any)?.name || 'Uncategorized'}
              </span>
            </div>

            {/* 3. Stats (Views) */}
            <div className="col-span-3 md:col-span-2 flex items-center gap-1 text-stone-500 text-sm">
              <Eye size={16} />
              {post.meta_data?.views || 0}
            </div>

            {/* 4. Actions Buttons */}
            <div className="col-span-3 md:col-span-2 flex justify-end gap-2">
              <Link 
                href={`/admin/posts/${post.id}`} 
                className="p-2 text-stone-400 hover:text-[#C5A059] hover:bg-[#C5A059]/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit size={18} />
              </Link>
              <button 
                onClick={() => handleDelete(post.id)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>

          </div>
        ))}

      </div>
      
      <div className="text-center text-xs text-stone-400 mt-6">
        Showing {filteredPosts.length} post{filteredPosts.length !== 1 && 's'}
      </div>

    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/libs/supabase';
import { ArrowLeft, Save, Loader2, Layout, Code, Dumbbell, BookOpen, ImageIcon, X, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/app/components/RichTextEditor';
import imageCompression from 'browser-image-compression'; // 👈 1. นำเข้า Library บีบอัดรูป

// Type Definition
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Helper: Slug Generator
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CreatePostPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // 👈 2. เพิ่ม State สถานะการอัปโหลด
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form Data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState(''); 

  // Meta Data States
  const [difficulty, setDifficulty] = useState('Beginner');
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [calories, setCalories] = useState('');

  // --- Fetch Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // Category Logic
  const selectedCategory = categories.find(c => c.id === categoryId);
  const catSlug = selectedCategory?.slug || '';
  const isBook = catSlug.includes('book') || catSlug.includes('read');
  const isCode = catSlug.includes('code') || catSlug.includes('dev');
  const isWorkout = catSlug.includes('workout') || catSlug.includes('fit');

  // --- 📸 3. ฟังก์ชันอัปโหลดและบีบอัดรูป ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true); // เริ่มหมุนติ้วๆ

    try {
      // A. ตั้งค่าการบีบอัด (ลดขนาดให้เว็บโหลดไว)
      const options = {
        maxSizeMB: 0.5,          // ขนาดไม่เกิน 0.5 MB
        maxWidthOrHeight: 1200,  // กว้างไม่เกิน 1200px
        useWebWorker: true,
        fileType: 'image/webp'   // แปลงเป็น WebP
      };

      // B. บีบอัดไฟล์
      const compressedFile = await imageCompression(file, options);
      
      // C. สร้างชื่อไฟล์ใหม่ (กันชื่อซ้ำ)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
      const filePath = `covers/${fileName}`; // เก็บในโฟลเดอร์ covers

      // D. อัปโหลดขึ้น Supabase Storage (Bucket ชื่อ 'images')
      const { error: uploadError } = await supabase.storage
        .from('images') 
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // E. ดึง URL มาใช้
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false); // หยุดหมุน
    }
  };

  // --- Save Function ---
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !categoryId) {
      alert("กรุณากรอก Title, Category และ Content ให้ครบถ้วน");
      return;
    }

    setSaving(true);

    try {
      const finalSlug = slug.trim() ? generateSlug(slug) : generateSlug(title);
      
      const metaDataPayload = {
        difficulty: difficulty,
        views: 0,
        ...(isBook && { rating: rating, author: author }),
        ...(isCode && { github_url: githubUrl }),
        ...(isWorkout && { calories: calories }),
      };

      const { error } = await supabase.from('posts').insert({
        title: title.trim(),
        slug: finalSlug,
        category_id: categoryId,
        content: content,
        excerpt: excerpt || '',
        cover_image: imageUrl || null, 
        published_at: new Date().toISOString(),
        is_featured: false,
        meta_data: metaDataPayload,
      });

      if (error) throw error;

      alert("✅ Published Successfully!");
      router.push('/admin/posts');

    } catch (err: any) {
      console.error("Error creating post:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#F5F5F4] z-10 py-4 border-b border-stone-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 rounded-full hover:bg-stone-200 transition-colors text-stone-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-800 tracking-tight">Create New Post</h1>
            <p className="text-stone-500 text-sm">Crafting content for <span className="text-[#C5A059] font-bold">{selectedCategory?.name || '...'}</span></p>
          </div>
        </div>
        
        <button
          onClick={handlePublish}
          disabled={saving || loading || uploading} // ห้ามกดถ้ากำลังอัปรูป
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#C5A059] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-stone-200 active:scale-95"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Publishing...' : 'Publish Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: Editor --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-black text-stone-900 bg-transparent border-none focus:ring-0 placeholder-stone-300 p-0"
              placeholder="Enter Title Here..."
            />
          </div>
          <div className="min-h-[500px] bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
             <RichTextEditor content={content} onChange={(html: React.SetStateAction<string>) => setContent(html)} />
          </div>
        </div>

        {/* --- RIGHT COLUMN: Settings --- */}
        <div className="space-y-6">
          
          {/* 👇 4. Cover Image Section (เปลี่ยนเป็นแบบ Upload) */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase flex items-center gap-2">
              <ImageIcon size={14} className="text-[#C5A059]" /> Cover Image
            </label>
            
            {/* พื้นที่แสดงผลรูป หรือ ปุ่มอัปโหลด */}
            {!imageUrl ? (
              <label className={`
                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                ${uploading ? 'bg-stone-50 border-stone-300' : 'border-stone-300 hover:border-[#C5A059] hover:bg-stone-50'}
              `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <>
                      <Loader2 size={32} className="text-[#C5A059] animate-spin mb-2" />
                      <p className="text-sm text-stone-500">Compressing & Uploading...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={32} className="text-stone-400 mb-2" />
                      <p className="text-sm text-stone-500 font-bold">Click to upload cover</p>
                      <p className="text-xs text-stone-400">JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                {/* Input file ซ่อนไว้ */}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            ) : (
              // แสดงรูป Preview พร้อมปุ่มลบ
              <div className="relative group">
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                  <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {imageUrl && (
              <p className="text-[10px] text-green-600 text-center font-medium mt-1">
                ✅ Image uploaded successfully
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase flex items-center gap-2">
              <Layout size={14} className="text-[#C5A059]" /> Category
            </label>
            {loading ? (
              <div className="text-sm text-stone-400 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : (
              <select 
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50"
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Dynamic Meta Data */}
          <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 shadow-inner space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 bg-white border border-stone-200 rounded text-sm">
                <option value="Beginner">🌱 Beginner</option>
                <option value="Intermediate">🚀 Intermediate</option>
                <option value="Advanced">🔥 Advanced</option>
              </select>
            </div>
            <div className="border-t border-stone-200 my-2"></div>
            
            {isBook && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-[#60A5FA] font-bold uppercase text-xs"><BookOpen size={14} /> Book Details</div>
                <div>
                  <label className="text-xs font-bold text-stone-500">Rating ({rating}/5)</label>
                  <input type="range" min="1" max="5" step="0.5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-[#60A5FA] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"/>
                  <div className="flex text-yellow-400 text-sm mt-1">{"★".repeat(Math.floor(rating))}{rating % 1 !== 0 && "½"}</div>
                </div>
                <div>
                   <label className="text-xs font-bold text-stone-500">Author</label>
                   <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. J.K. Rowling" className="w-full p-2 bg-white border border-stone-200 rounded text-sm"/>
                </div>
              </div>
            )}
            
            {isCode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-[#A78BFA] font-bold uppercase text-xs"><Code size={14} /> Repository</div>
                <div>
                  <label className="text-xs font-bold text-stone-500">GitHub URL</label>
                  <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="w-full p-2 bg-white border border-stone-200 rounded text-sm"/>
                </div>
              </div>
            )}
            
            {isWorkout && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-[#34D399] font-bold uppercase text-xs"><Dumbbell size={14} /> Workout Stats</div>
                <div>
                  <label className="text-xs font-bold text-stone-500">Calories (kcal)</label>
                  <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="e.g. 350" className="w-full p-2 bg-white border border-stone-200 rounded text-sm"/>
                </div>
              </div>
            )}
            
            {!isBook && !isCode && !isWorkout && <div className="text-center text-xs text-stone-400 italic py-2">Select a specific category to see more options.</div>}
          </div>

          {/* Slug & Excerpt */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
             <div>
                <label className="text-xs font-bold text-stone-800 uppercase">URL Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={title ? generateSlug(title) : "auto-generated"} className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 font-mono"/>
             </div>
             <div>
                <label className="text-xs font-bold text-stone-800 uppercase">Excerpt</label>
                <textarea rows={4} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 resize-none" placeholder="Short description..."/>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
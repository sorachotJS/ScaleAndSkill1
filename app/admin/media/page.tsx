'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/libs/supabase';
import { 
  UploadCloud, Loader2, Copy, Trash2, 
  Image as ImageIcon, CheckCircle2, ArrowLeft, RefreshCw 
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

// Type สำหรับไฟล์รูปภาพ
interface MediaFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size: number;
}

export default function MediaLibraryPage() {
  const supabase = createClient();
  
  // --- States ---
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null); // เช็คว่ารูปไหนเพิ่งกด copy

  // --- 1. Fetch Images ---
  const fetchImages = async () => {
    setLoading(true);
    try {
      // ดึงรายชื่อไฟล์จาก Bucket 'images' โฟลเดอร์ 'library'
      const { data, error } = await supabase.storage
        .from('images')
        .list('library', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // แปลงข้อมูลไฟล์ให้มี URL พร้อมใช้
      const fileList: MediaFile[] = data.map((file) => {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(`library/${file.name}`);

        return {
          id: file.id,
          name: file.name,
          url: urlData.publicUrl,
          created_at: file.created_at,
          size: file.metadata?.size || 0,
        };
      });

      setFiles(fileList);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // --- 2. Upload Image ---
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // A. บีบอัดรูป
      const options = {
        maxSizeMB: 1,          // ให้ใหญ่กว่าปกนิดนึง (1MB) เผื่อใช้ในเนื้อหา
        maxWidthOrHeight: 1920, // Full HD
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const compressedFile = await imageCompression(file, options);

      // B. ตั้งชื่อไฟล์ (ใช้ Timestamp กันชื่อซ้ำ)
      const fileName = `library/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

      // C. อัปโหลด
      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, compressedFile);

      if (error) throw error;

      // D. โหลดข้อมูลใหม่
      await fetchImages();

    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input value เพื่อให้เลือกไฟล์เดิมซ้ำได้ถ้าต้องการ
      event.target.value = '';
    }
  };

  // --- 3. Copy Link ---
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    
    // คืนค่า icon ให้กลับเป็นเหมือนเดิมหลัง 2 วินาที
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- 4. Delete Image ---
  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([`library/${fileName}`]);

      if (error) throw error;

      // ลบออกจาก State ทันที ไม่ต้องรอโหลดใหม่ (UX ดีกว่า)
      setFiles((prev) => prev.filter((f) => f.name !== fileName));

    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-[#F5F5F4]/90 backdrop-blur-md z-10 py-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Media Library</h1>
            <p className="text-stone-500 text-xs">Upload images for your blog posts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={fetchImages} 
             className="p-2 text-stone-400 hover:text-[#C5A059] transition-colors"
             title="Refresh"
           >
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
           
           <label className={`
             flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-[#C5A059] transition-all shadow-lg active:scale-95
             ${uploading ? 'opacity-70 cursor-not-allowed' : ''}
           `}>
             {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={18} />}
             {uploading ? 'Uploading...' : 'Upload Image'}
             <input 
               type="file" 
               className="hidden" 
               accept="image/*"
               onChange={handleUpload}
               disabled={uploading}
             />
           </label>
        </div>
      </div>

      {/* Grid Content */}
      {loading && files.length === 0 ? (
        <div className="flex justify-center items-center h-60 text-stone-400 gap-2">
          <Loader2 className="animate-spin" /> Loading Library...
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 gap-3">
          <ImageIcon size={48} className="opacity-20" />
          <p>No images yet. Upload one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div key={file.id} className="group relative bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              
              {/* Image Preview */}
              <div className="aspect-square relative bg-stone-100">
                <Image 
                  src={file.url} 
                  alt={file.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   {/* Copy Button */}
                   <button 
                     onClick={() => handleCopyLink(file.url, file.id)}
                     className="p-2 bg-white text-stone-800 rounded-full hover:bg-[#C5A059] hover:text-white transition-colors shadow-lg transform hover:scale-110"
                     title="Copy URL"
                   >
                     {copiedId === file.id ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                   </button>

                   {/* Delete Button */}
                   <button 
                     onClick={() => handleDelete(file.name)}
                     className="p-2 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg transform hover:scale-110"
                     title="Delete"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>

              {/* File Info */}
              <div className="p-3 bg-white">
                <p className="text-[10px] text-stone-400 truncate font-mono mb-1">{file.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  {copiedId === file.id && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                      <CheckCircle2 size={10} /> Copied!
                    </span>
                  )}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
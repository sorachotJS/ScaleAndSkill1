'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/libs/supabase';
import { Loader2, X, Calendar, ZoomIn } from 'lucide-react';

// Type Definition
interface GalleryItem {
  id: number;
  image_url: string;
  caption: string;
  taken_at: string;
}

export default function GalleryPage() {
  const supabase = createClient();
  
  // States
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null); // สำหรับ Lightbox

  // 1. Fetch Data
  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      // ดึงรูปทั้งหมด เรียงจากใหม่ไปเก่า
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('taken_at', { ascending: false });

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    };

    fetchGallery();
  }, []);

  // ฟังก์ชันปิด Lightbox เมื่อกดปุ่ม ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F4] font-sans selection:bg-[#C5A059]/30">
      
   

      {/* 2. Header Section */}
      <div className="pt-32 pb-12 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-stone-800 tracking-tight mb-4 uppercase">
          Our <span className="text-[#C5A059]">Memories</span>
        </h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Collections of moments, places, and smiles. <br className="hidden md:block"/>
          Saving the best part of every day.
        </p>
      </div>

      {/* 3. Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-60 text-stone-400 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-sm font-medium tracking-widest uppercase">Loading Gallery...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-stone-400 py-20 bg-white rounded-3xl border border-stone-200">
            No photos yet. Stay tuned! 📸
          </div>
        ) : (
          /* Masonry Layout (Pinterest Style) */
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="break-inside-avoid relative group cursor-zoom-in rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-white border border-stone-100 mb-4"
                onClick={() => setSelectedImage(item)}
              >
                {/* Image */}
                <Image
                  src={item.image_url}
                  alt={item.caption || 'Gallery Image'}
                  width={0}
                  height={0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Overlay on Hover (แสดงวันที่ & Caption) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2 text-[#C5A059] text-xs font-bold uppercase tracking-wider mb-2">
                      <Calendar size={12} />
                      {new Date(item.taken_at).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </div>
                    {item.caption && (
                      <p className="text-white text-sm font-medium line-clamp-3 leading-relaxed">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* Zoom Icon Hint */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ZoomIn size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Lightbox Modal (Full Screen) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] bg-stone-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // กดพื้นหลังปิด
        >
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>

          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} // กดที่รูปไม่ปิด
          >
            {/* Full Image */}
            <div className="relative w-full h-[70vh] md:h-[80vh]">
              <Image
                src={selectedImage.image_url}
                alt={selectedImage.caption || 'Full Image'}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Caption Details */}
            <div className="mt-6 text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C5A059] text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={12} />
                {new Date(selectedImage.taken_at).toLocaleDateString('th-TH', { 
                   weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </div>
              {selectedImage.caption && (
                <p className="text-stone-300 text-base md:text-lg font-medium leading-relaxed">
                  "{selectedImage.caption}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
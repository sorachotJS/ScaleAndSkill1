"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/libs/supabase";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Calendar,
  AlertCircle,
  Download
} from "lucide-react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation"; // เพิ่ม Router เพื่อดีดคนไม่ได้ Login ออก

interface GalleryItem {
  id: number;
  image_url: string;
  caption: string;
  taken_at: string;
  created_at: string;
}

export default function AdminGallery() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // เพิ่ม State เช็ค User
  const [user, setUser] = useState<any>(null);

  // Form State
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dateTaken, setDateTaken] = useState(
    new Date().toISOString().split("T")[0],
  );

  // --- 1. เช็ค User และโหลดข้อมูล ---
  useEffect(() => {
    const init = async () => {
      // A. เช็คว่ามี User ไหม?
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        // ถ้าไม่มี User ให้แจ้งเตือน หรือเด้งไปหน้า Login
        alert("กรุณาเข้าสู่ระบบก่อนใช้งาน Gallery ครับ");
        router.push("/login");
        return;
      }

      // B. ถ้ามี User ค่อยโหลดรูป
      fetchGallery();
    };
    init();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    // เพิ่มการ Error Handling ตอนดึงรูป
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("taken_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // เช็ค User อีกรอบเพื่อความชัวร์ (Double Check)
    if (!user) {
      alert("Session หมดอายุ กรุณา Login ใหม่");
      router.push("/login");
      return;
    }

    try {
      setUploading(true);

      // 1. ย่อรูป
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(selectedFile, options);

      // 2. อัปโหลดลง Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // ใส่ใน Root folder เลย

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, compressedFile);

      if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

      // 3. ขอ URL
      const { data: publicUrlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);

      // 4. บันทึกลง Database
      const { error: dbError } = await supabase.from("gallery").insert({
        caption: caption,
        image_url: publicUrlData.publicUrl,
        taken_at: dateTaken,
        // user_id: user.id // (Optional: ถ้าใน Table มี column user_id ให้ uncomment บรรทัดนี้)
      });

      if (dbError)
        throw new Error(
          `Database Error: ${dbError.message} (Code: ${dbError.code})`,
        );

      // 5. สำเร็จ!
      alert("บันทึกความทรงจำเรียบร้อย! ✅");
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchGallery();
    } catch (error: any) {
      console.error("Full Error:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, imageUrl: string) => {
    if (!confirm("ยืนยันจะลบรูปนี้? (ไฟล์จะถูกลบถาวร)")) return;

    try {
      // 1. สกัดชื่อไฟล์ออกจาก URL
      // ตัวอย่าง URL: https://.../storage/v1/object/public/gallery/170701234.jpg
      // เราต้องการแค่: 170701234.jpg (ตัวสุดท้ายหลัง /)
      const fileName = imageUrl.split("/").pop();

      if (fileName) {
        // 2. ลบไฟล์ออกจาก Storage ('gallery' คือชื่อ Bucket)
        const { error: storageError } = await supabase.storage
          .from("gallery")
          .remove([fileName]); // ต้องส่งเป็น Array

        if (storageError) {
          console.warn("ลบไฟล์ Storage ไม่สำเร็จ:", storageError);
          // ไม่ต้อง return ออก ให้มันไปลบใน DB ต่อเลย (เผื่อไฟล์ไม่มีอยู่จริง)
        }
      }

      // 3. ลบข้อมูลใน Database Table
      const { error: dbError } = await supabase
        .from("gallery")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // 4. รีเฟรชหน้า
      // alert('ลบเรียบร้อยแล้วครับ'); // (Optional: ถ้าไม่อยากให้เด้งเตือนก็ลบออกได้)
      fetchGallery();
    } catch (error: any) {
      console.error("Delete Error:", error);
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
    }
  };

  // ฟังก์ชันสำหรับบังคับดาวน์โหลดรูป
  const handleDownload = async (imageUrl: string, caption: string) => {
    try {
      // 1. ดึงข้อมูลรูปภาพมาเป็น Blob (Binary Large Object)
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 2. สร้าง URL ชั่วคราวสำหรับ Blob นี้
      const url = window.URL.createObjectURL(blob);
      
      // 3. สร้าง Element <a> ล่องหนเพื่อกดดาวน์โหลด
      const link = document.createElement('a');
      link.href = url;
      
      // ตั้งชื่อไฟล์ (เอา caption มาตั้ง หรือถ้าไม่มีก็สุ่มชื่อเอา)
      const fileName = caption 
        ? `${caption.substring(0, 10)}.jpg` // เอา 10 ตัวอักษรแรก
        : `family-memory-${Date.now()}.jpg`;
        
      link.download = fileName;
      
      // 4. สั่งกดลิงก์แล้วลบทิ้ง
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // คืน memory

    } catch (error) {
      console.error('Download failed:', error);
      alert('ดาวน์โหลดไม่สำเร็จ อาจเกิดจากปัญหาเครือข่าย');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">
        Family Gallery 📸
      </h1>
      <p className="text-stone-500 mb-8">เก็บความทรงจำดีๆ ในทุกวัน</p>

      {/* --- DEBUG ZONE (โชว์สถานะ User) --- */}
      {!user && !loading && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          คุณยังไม่ได้เข้าสู่ระบบ หรือ Session หลุด (กรุณา Login ใหม่)
        </div>
      )}

      {/* --- UPLOAD CARD --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                ${previewUrl ? "border-[#C5A059]" : "border-stone-300 hover:border-stone-400 hover:bg-stone-50"}
              `}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <>
                  <Upload
                    size={32}
                    className="text-stone-400 mb-2 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm text-stone-500 font-medium">
                    Click to Add Photo
                  </span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                Date Taken
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3 text-stone-400"
                />
                <input
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 text-stone-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                Caption / Story
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="เล่าเรื่องราวความทรงจำ..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 text-stone-700 resize-none"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !user} // ห้ามกดถ้าไม่มี User
              className={`
                mt-auto py-3 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2
                ${
                  !selectedFile || uploading || !user
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-[#C5A059] hover:scale-[1.02]"
                }
              `}
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              {uploading ? "Compressing & Uploading..." : "Save Memory"}
            </button>
          </div>
        </div>
      </div>

      {/* --- GALLERY GRID --- */}
      <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
        <ImageIcon size={24} className="text-[#C5A059]" />
        Your Timeline
      </h2>

      {loading ? (
        <div className="text-center py-20 text-stone-400">
          Loading memories...
        </div>
      ) : (
        /* 👇 เปลี่ยนเป็น masonry-style แบบง่ายๆ (Columns) */
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden group hover:shadow-md transition-shadow mb-6"
            >
              {/* 👇 1. ลบ aspect-[4/3] ออก และปรับ Image */}
              <div className="relative">
                <Image
                  src={item.image_url}
                  alt={item.caption || "Memory"}
                  // ใช้เทคนิคนี้เพื่อให้รูปขยายเต็มความกว้าง แต่สูงตามจริง (ไม่โดนตัด)
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto object-contain"
                />

                {/* ปุ่มลบ (Overlay) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 {/* 👇 ปุ่ม Download (สีเขียว/ฟ้า) */}
                  <button 
                    onClick={() => handleDownload(item.image_url, item.caption)}
                    className="text-white bg-sky-500/90 hover:bg-sky-600 p-3 rounded-full backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                    title="Download Photo"
                  >
                    <Download size={24} />
                  </button>
                  <button
                    // 👇 ส่ง item.image_url ไปด้วยครับ
                    onClick={() => handleDelete(item.id, item.image_url)}
                    className="text-white bg-red-500/80 hover:bg-red-600 p-3 rounded-full backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                    title="Delete this memory"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C5A059] mb-2">
                  <Calendar size={12} />
                  {new Date(item.taken_at).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {/* ถ้ามี caption ให้โชว์ ถ้าไม่มีซ่อนไปเลยก็ได้ */}
                {item.caption && (
                  <p className="text-stone-700 text-sm whitespace-pre-wrap">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

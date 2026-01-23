import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // เช็คให้ชัวร์ก่อน ถ้าไม่มีค่าให้ Error บอกเลย จะได้ไม่เสียเวลาหา
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase Url or Key is missing!');
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
export type Category = {
  id: string;
  name: string;
  slug: string;
  // เพิ่ม 'code' เข้าไปตรงนี้
  content_type: 'workout' | 'book' | 'article' | 'code'; 
  color: string;
  icon_key?: string | null;
};
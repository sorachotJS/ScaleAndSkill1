'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
// 👇 1. นำเข้า Node และ mergeAttributes
import { Node, mergeAttributes } from '@tiptap/core'; 

import { 
  Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Quote, ImageIcon, Link as LinkIcon,
  Baseline, Eraser, Target // 👈 2. เพิ่ม Icon Target
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

// 👇 3. สร้าง Extension ชื่อ ProTip (ประกาศไว้นอก Component)
const ProTipExtension = Node.create({
  name: 'proTip',
  group: 'block',
  content: 'block+', // อนุญาตให้ใส่ย่อหน้าข้างในได้
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="pro-tip"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // เวลาแสดงผล ให้ใส่ class 'pro-tip-box'
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'pro-tip', class: 'pro-tip-box' }), 0];
  },
});

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextStyle, 
      Color,
      Link.configure({ openOnClick: false }),
      ProTipExtension, // 👈 4. ยัด Extension ใส่ Editor
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[200px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  // ... (ฟังก์ชัน addImage, setLink เหมือนเดิม ไม่ต้องแก้) ...
  const addImage = () => {
    const url = window.prompt('URL ของรูปภาพ');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#C5A059]/50 transition-all">
      
      {/* --- Toolbar --- */}
      <div className="bg-stone-50 border-b border-stone-200 p-2 flex flex-wrap gap-1 items-center">
        
        {/* ... ปุ่มเดิม ... */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={18} />} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={18} />} />
        
        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={<Heading1 size={18} />} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={<Heading2 size={18} />} />
        
        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
        
        {/* 👇 5. เพิ่มปุ่ม Pro Tip (รูปเป้าหมาย) */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleWrap('proTip').run()} 
          isActive={editor.isActive('proTip')} 
          icon={<Target size={18} className={editor.isActive('proTip') ? 'text-[#C5A059]' : ''} />} 
        />

        {/* ... ปุ่มเดิมอื่นๆ ... */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List size={18} />} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={<ListOrdered size={18} />} />
        
        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />

        {/* Color Picker (Code เดิม) */}
        <div className="flex items-center gap-1 border border-stone-200 rounded px-1 bg-white h-[34px]">
            <label className="cursor-pointer flex items-center justify-center p-1" title="Text Color">
                <Baseline size={18} className="text-stone-600 mr-1" />
                <input
                    type="color"
                    onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                />
            </label>
        </div>
        <button onClick={() => editor.chain().focus().unsetColor().run()} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded"><Eraser size={18} /></button>

        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />

        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} icon={<LinkIcon size={18} />} />
        <ToolbarButton onClick={addImage} isActive={false} icon={<ImageIcon size={18} />} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={<Quote size={18} />} />

      </div>

      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}

function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-stone-200 transition-colors ${
        isActive ? 'bg-stone-200 text-stone-900' : 'text-stone-500'
      }`}
    >
      {icon}
    </button>
  );
}
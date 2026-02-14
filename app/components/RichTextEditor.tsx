'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Node, mergeAttributes } from '@tiptap/core';

import {
  Bold, Italic, List, ListOrdered,
  Heading1, Heading2, Quote, ImageIcon, Link as LinkIcon,
  Baseline, Eraser, Target, AlignLeft, AlignCenter, AlignRight,
  Maximize2, Minimize2
} from 'lucide-react';

// --- 1. Custom Image Extension (รองรับ Width และ Float Layout) ---
const SmartImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
      layout: {
        default: 'center',
        renderHTML: attributes => {
          if (attributes.layout === 'left') {
            return { style: 'float: left; margin: 0 1.5rem 1rem 0; clear: left;' };
          }
          if (attributes.layout === 'right') {
            return { style: 'float: right; margin: 0 0 1rem 1.5rem; clear: right;' };
          }
          return { style: 'display: block; margin: 1.5rem auto; clear: both;' };
        },
      },
    };
  },
});

const ProTipExtension = Node.create({
  name: 'proTip',
  group: 'block',
  content: 'block+',
  draggable: true,
  parseHTML() { return [{ tag: 'div[data-type="pro-tip"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'pro-tip', class: 'pro-tip-box' }), 0];
  },
});

// --- 2. Main Component ---
export default function RichTextEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SmartImage.configure({ allowBase64: true }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      ProTipExtension,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-stone focus:outline-none max-w-none min-h-[400px] px-8 py-6 shadow-inner bg-white',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  if (!editor) return null;

  // --- ฟังก์ชันเพิ่มรูปพร้อมกำหนดขนาดและ Layout ---
  const addImageWithLayout = () => {
    const url = window.prompt('1. วาง URL รูปภาพ:');
    if (!url) return;

    const sizeInput = window.prompt('2. กำหนดความกว้าง (เช่น 300px, 50%, 100%):', '100%');
    const layoutInput = window.prompt('3. เลือกเลย์เอาต์ (พิมพ์: left = ชิดซ้ายข้อความล้อม, right = ชิดขวาข้อความล้อม, center = ตรงกลาง):', 'center');

    const width = sizeInput || '100%';
    const layout = ['left', 'right', 'center'].includes(layoutInput || '') ? layoutInput : 'center';

    editor.chain().focus().setImage({ 
      src: url, 
      // @ts-ignore
      width: width, 
      layout: layout 
    }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL ลิงก์:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-[#fcfaf8] shadow-lg">
      
      {/* --- Custom Toolbar --- */}
      <div className="bg-white border-b border-stone-200 p-3 flex flex-wrap gap-1 items-center sticky top-0 z-30">
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={18} />} title="ตัวหนา" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={18} />} title="ตัวเอียง" />
        
        <div className="v-divider" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={<Heading1 size={18} />} title="หัวข้อใหญ่" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={<Heading2 size={18} />} title="หัวข้อย่อย" />
        
        <div className="v-divider" />
        
        <ToolbarButton onClick={addImageWithLayout} isActive={false} icon={<ImageIcon size={18} />} title="เพิ่มรูปภาพพร้อมขนาด" />
        
        {/* Quick Resize Controls เมื่อคลิกที่รูป */}
        {editor.isActive('image') && (
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-[#C5A059] ml-2 animate-in fade-in zoom-in-95">
             <button onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'left', width: '33%' }).run()} className="p-1 hover:bg-white rounded" title="ชิดซ้าย-ล้อมคำ"><AlignLeft size={14} /></button>
             <button onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'center', width: '100%' }).run()} className="p-1 hover:bg-white rounded" title="กลาง-เต็มหน้า"><AlignCenter size={14} /></button>
             <button onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'right', width: '33%' }).run()} className="p-1 hover:bg-white rounded" title="ชิดขวา-ล้อมคำ"><AlignRight size={14} /></button>
             <div className="v-divider h-4" />
             <button onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()} className="px-2 text-[10px] font-bold">50%</button>
          </div>
        )}

        <div className="v-divider" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleWrap('proTip').run()} 
          isActive={editor.isActive('proTip')} 
          icon={<Target size={18} className={editor.isActive('proTip') ? 'text-[#C5A059]' : ''} />} 
          title="กล่อง Pro Tip"
        />

        <div className="v-divider" />

        <div className="flex items-center gap-1 border border-stone-200 rounded px-2 bg-stone-50 h-[34px]">
            <Baseline size={16} className="text-stone-500" />
            <input
                type="color"
                onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
            />
            <button onClick={() => editor.chain().focus().unsetColor().run()} className="ml-1 text-stone-400 hover:text-red-500"><Eraser size={14} /></button>
        </div>

        <div className="ml-auto flex gap-1">
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} icon={<LinkIcon size={18} />} title="ใส่ลิงก์" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={<Quote size={18} />} title="คำคม" />
        </div>
      </div>

      {/* --- Editor Area --- */}
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>

      {/* --- CSS Styling --- */}
      <style jsx global>{`
        .v-divider { width: 1px; height: 1.5rem; background: #e5e7eb; margin: 0 6px; }
        
        /* Layout: Pro Tip Box */
        .pro-tip-box {
          background: #fdfaf3;
          border-left: 5px solid #C5A059;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 4px 12px 12px 4px;
          clear: both;
        }

        /* Layout: Image Styling & Selection */
        .ProseMirror img {
          max-width: 100%;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #C5A059;
          box-shadow: 0 0 20px rgba(197, 160, 89, 0.3);
          transform: scale(1.01);
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: 'เริ่มเขียนบทความที่น่าสนใจของคุณ...';
          color: #adb5bd;
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- Sub-component: ToolbarButton ---
function ToolbarButton({ onClick, isActive, icon, title }: { onClick: () => void, isActive: boolean, icon: React.ReactNode, title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-[#C5A059] text-white shadow-md' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {icon}
    </button>
  );
}
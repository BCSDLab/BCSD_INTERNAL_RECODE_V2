'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { INPUT_CLASS } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { useImageUpload } from '@/hooks/useImageUpload';

/**
 * 시안의 본문 에디터: line 테두리 radius 12 한 덩어리 안에
 * 툴바(panel2 배경, padding 8·10, 구분선 1×18) · 본문(min-height 280, padding 18·20) ·
 * 바닥(panel2 배경, 글자수 + 안내문)이 들어간다.
 */
export function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const { upload } = useImageUpload('ACTIVITY_CONTENT');
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content,
    immediatelyRender: false,
    onCreate: ({ editor: created }) => setCharCount(created.getText().length),
    onUpdate: ({ editor: updated }) => {
      onChange(updated.getHTML());
      setCharCount(updated.getText().length);
    },
  });

  if (!editor) {
    return null;
  }
  const active = editor;

  function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      try {
        active
          .chain()
          .focus()
          .setImage({ src: await upload(file) })
          .run();
      } catch {
        // useImageUpload가 이미 error 상태를 들고 있다.
      }
    };
    input.click();
  }

  return (
    <div className="border-line flex flex-col overflow-hidden rounded-xl border">
      <div className="border-line bg-panel2 flex flex-wrap items-center gap-1 border-b px-2.5 py-2">
        <ToolButton editor={active} mark="bold" onClick={() => active.chain().focus().toggleBold().run()}>
          <span className="text-[13px] font-bold">B</span>
        </ToolButton>
        <ToolButton editor={active} mark="italic" onClick={() => active.chain().focus().toggleItalic().run()}>
          <span className="text-[13px] italic">I</span>
        </ToolButton>
        <ToolButton editor={active} mark="underline" onClick={() => active.chain().focus().toggleUnderline().run()}>
          <span className="text-[13px] underline">U</span>
        </ToolButton>
        <span className="bg-line mx-1 h-[18px] w-px flex-none" />
        <ToolButton editor={active} mark="bulletList" onClick={() => active.chain().focus().toggleBulletList().run()}>
          목록
        </ToolButton>
        <ToolButton editor={active} mark="blockquote" onClick={() => active.chain().focus().toggleBlockquote().run()}>
          인용
        </ToolButton>
        <ToolButton editor={active} mark="link" onClick={() => setIsLinkOpen(true)}>
          링크
        </ToolButton>
        <ToolButton editor={active} onClick={insertImage}>
          이미지
        </ToolButton>
      </div>

      <EditorContent
        editor={active}
        className="bg-panel [&_blockquote]:border-primary-line [&_blockquote]:text-muted min-h-[280px] px-5 py-[18px] text-sm leading-[1.8] [&_.ProseMirror]:outline-none [&_blockquote]:border-l-2 [&_blockquote]:pl-3.5 [&_img]:max-w-full [&_img]:rounded-[11px] [&_ul]:list-disc [&_ul]:pl-5"
      />

      <div className="border-line bg-panel2 text-faint flex items-center gap-2.5 border-t px-3 py-2 text-[11px]">
        <span className="whitespace-nowrap">{charCount.toLocaleString()}자</span>
        <span className="ml-auto flex-none whitespace-nowrap">
          본문은 활동 상세에서 전체가 보이고, 목록에는 요약만 노출됩니다
        </span>
      </div>

      {isLinkOpen && (
        <Modal
          title="링크 삽입"
          onClose={() => setIsLinkOpen(false)}
          width="400px"
          footer={
            <>
              <Button onClick={() => setIsLinkOpen(false)} className="ml-auto px-4 py-2.5">
                취소
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (linkUrl.trim()) {
                    active.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
                  }
                  setIsLinkOpen(false);
                  setLinkUrl('');
                }}
                className="px-[18px] py-2.5"
              >
                삽입
              </Button>
            </>
          }
        >
          <div className="px-6 py-5">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className={INPUT_CLASS}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ToolButton({
  editor,
  mark,
  onClick,
  children,
}: {
  editor: Editor;
  mark?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isActive = mark ? editor.isActive(mark) : false;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none cursor-pointer rounded-[7px] px-[9px] py-[5px] text-xs whitespace-nowrap transition-colors ${
        isActive ? 'bg-sunken text-text' : 'text-muted hover:bg-sunken hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

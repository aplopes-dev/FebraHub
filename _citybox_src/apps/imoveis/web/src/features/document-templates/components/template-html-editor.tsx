'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Button, Stack } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

export type TemplateHtmlEditorHandle = {
  insertTag: (tag: string) => void;
};

type TemplateHtmlEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export const TemplateHtmlEditor = forwardRef<
  TemplateHtmlEditorHandle,
  TemplateHtmlEditorProps
>(function TemplateHtmlEditor({ value, onChange }, ref) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    insertTag: (tag: string) => {
      editor?.chain().focus().insertContent(`{{${tag}}}`).run();
    },
  }));

  if (!editor) return null;

  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant={editor.isActive('bold') ? 'contained' : 'text'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          N
        </Button>
        <Button
          size="small"
          variant={editor.isActive('heading', { level: 2 }) ? 'contained' : 'text'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          size="small"
          variant={editor.isActive('bulletList') ? 'contained' : 'text'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Lista
        </Button>
      </Stack>
      <Box
        sx={(theme) => ({
          bgcolor: listifyElevatedSurface(theme),
          borderRadius: '16px',
          px: 2,
          py: 1.5,
          minHeight: 240,
          '& .ProseMirror': {
            outline: 'none',
            minHeight: 200,
            fontSize: '0.9375rem',
            lineHeight: 1.5,
          },
        })}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
});

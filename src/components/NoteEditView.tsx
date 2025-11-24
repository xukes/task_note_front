import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Columns, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

interface NoteEditViewProps {
  initialContent: string;
  onSave: (content: string) => void;
  onBack: () => void;
}

export function NoteEditView({ initialContent, onSave, onBack }: NoteEditViewProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');

  // 监听 ESC 键返回
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const textarea = e.currentTarget as HTMLTextAreaElement;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;

        try {
          const response = await api.uploadImage(file);
          const imageMarkdown = `![image](${response})`;
          const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
          setContent(newContent);
          
          // 恢复光标位置
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
            textarea.focus();
          }, 0);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('图片上传失败');
        }
      }
    }
  };

  const handleSave = () => {
    onSave(content);
    onBack();
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回详情
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('edit')}
              className={`p-2 rounded-md transition-all ${
                mode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="纯编辑模式"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={`p-2 rounded-md transition-all ${
                mode === 'split' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="分屏模式"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`p-2 rounded-md transition-all ${
                mode === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="预览模式"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          保存更改
        </button>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 编辑器 */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`h-full p-6 ${mode === 'split' ? 'w-1/2 border-r border-gray-100' : 'w-full'}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              className="w-full h-full resize-none border-none focus:ring-0 p-0 text-gray-700 font-mono leading-relaxed bg-transparent outline-none"
              placeholder="在此输入 Markdown 内容..."
            />
          </div>
        )}

        {/* 预览区 */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`h-full overflow-y-auto p-8 prose prose-blue max-w-none ${mode === 'split' ? 'w-1/2 bg-gray-50' : 'w-full'}`}>
            <ReactMarkdown>
              {content || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
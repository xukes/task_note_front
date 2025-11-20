import React, { useState, useEffect } from 'react';
import { X, Eye, Edit3, Columns, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (content: string) => void;
}

type EditorMode = 'edit' | 'split' | 'preview';

export const MarkdownEditorModal: React.FC<MarkdownEditorModalProps> = ({
  isOpen,
  onClose,
  initialValue,
  onSave
}) => {
  const [content, setContent] = useState(initialValue);
  const [mode, setMode] = useState<EditorMode>('split');

  useEffect(() => {
    if (isOpen) {
      setContent(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const MarkdownPreview = () => (
    <div className="prose prose-sm max-w-none p-4 overflow-y-auto h-full bg-white">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ borderRadius: '0.5rem', margin: '0.5rem 0', fontSize: '12px' }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className={`${className} bg-gray-100 px-1 py-0.5 rounded text-red-500 font-mono text-xs`}>
                {children}
              </code>
            );
          }
        }}
      >
        {content || '*暂无内容*'}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 size={16} />
              编辑
            </button>
            <button
              onClick={() => setMode('split')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Columns size={16} />
              分屏
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye size={16} />
              预览
            </button>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {mode === 'edit' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="在此输入 Markdown 内容..."
              autoFocus
            />
          )}

          {mode === 'preview' && (
            <MarkdownPreview />
          )}

          {mode === 'split' && (
            <div className="flex h-full divide-x divide-gray-200">
              <div className="w-1/2 h-full">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  placeholder="在此输入 Markdown 内容..."
                  autoFocus
                />
              </div>
              <div className="w-1/2 h-full overflow-hidden">
                <MarkdownPreview />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
          >
            <Save size={18} />
            保存内容
          </button>
        </div>

      </div>
    </div>
  );
};

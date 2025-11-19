import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';

interface AddTaskFormProps {
  onAdd: (title: string, note: string) => void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), note.trim());
      setTitle('');
      setNote('');
      setIsExpanded(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await api.uploadImage(file);
      const imageMarkdown = `\n![image](${url})\n`;
      setNote(prev => prev + imageMarkdown);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          try {
            const url = await api.uploadImage(file);
            const imageMarkdown = `\n![image](${url})\n`;
            setNote(prev => prev + imageMarkdown);
          } catch (error) {
            console.error('Failed to upload pasted image:', error);
            alert('图片上传失败');
          }
        }
        break;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={title}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="添加新任务..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {isExpanded && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onPaste={handlePaste}
            placeholder="添加备注 (可选，支持粘贴图片)..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          <div className="flex justify-between items-center">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="上传图片"
              >
                <ImageIcon size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                添加任务
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

import React, { useState, useRef } from 'react';
import { Task, Note } from '../types';
import { X, Send, Pencil, Trash2, CheckCircle2, Image as ImageIcon, Timer, Maximize2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { api } from '../api';
import { MarkdownEditorModal } from './MarkdownEditorModal';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onAddNote: (taskId: number, content: string) => void;
  onUpdateTitle: (taskId: number, title: string) => void;
  onUpdateTask: (taskId: number, updates: Partial<Task>) => void;
  onDeleteNote: (taskId: number, noteId: number) => void;
  onUpdateNote: (taskId: number, noteId: number, content: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  onClose, 
  onAddNote, 
  onUpdateTitle,
  onUpdateTask,
  onDeleteNote,
  onUpdateNote
}) => {
  const [newNote, setNewNote] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeSpent, setTimeSpent] = useState(task.timeSpent?.toString() || '');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour' | 'day' | 'week' | 'month'>(task.timeUnit || 'minute');
  const [isMarkdownEditorOpen, setIsMarkdownEditorOpen] = useState(false);
  const [fullScreenNote, setFullScreenNote] = useState<{id: number, content: string} | null>(null);

  const handleTimeBlur = () => {
    const value = parseFloat(timeSpent);
    if (!isNaN(value) && value >= 0) {
      if (value !== task.timeSpent || timeUnit !== task.timeUnit) {
        onUpdateTask(task.id, { timeSpent: value, timeUnit });
      }
    } else if (timeSpent === '') {
      if (task.timeSpent !== undefined && task.timeSpent !== 0) {
         onUpdateTask(task.id, { timeSpent: 0, timeUnit });
      }
      setTimeSpent('');
    } else {
      // Reset invalid input
      setTimeSpent(task.timeSpent?.toString() || '');
      setTimeUnit(task.timeUnit || 'minute');
    }
    setIsEditingTime(false);
  };



  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(task.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleTitleBlur = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== task.title) {
      onUpdateTitle(task.id, trimmedTitle);
    } else if (!trimmedTitle) {
      setTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  const saveNoteEdit = (noteId: number) => {
    if (editNoteContent.trim()) {
      onUpdateNote(task.id, noteId, editNoteContent.trim());
      setEditingNoteId(null);
    }
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
    setEditNoteContent('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await api.uploadImage(file);
      const imageMarkdown = `\n![image](${url})\n`;
      setNewNote(prev => prev + imageMarkdown);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败');
    }
    
    // Reset input
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
            setNewNote(prev => prev + imageMarkdown);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[90vw] max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                autoFocus
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
              />
            ) : (
              <h2 
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              >
                {task.title}
              </h2>
            )}
            <div className="text-sm text-gray-500 mt-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Timer size={14} />
                任务时间 {format(task.taskTime || task.createdAt, 'PP p', { locale: zhCN })}
              </div>
              {task.completed && task.completedAt && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={14} />
                  完成于 {format(task.completedAt, 'PP p', { locale: zhCN })}
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-600 group/time">
                <Timer size={14} />
                <span>耗时: </span>
                {isEditingTime ? (
                  <div 
                    className="flex items-center gap-1"
                    onBlur={(e) => {
                      // If the new focus target is within this container, do not close edit mode
                      if (e.currentTarget.contains(e.relatedTarget as Node)) {
                        return;
                      }
                      handleTimeBlur();
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTimeBlur()}
                      autoFocus
                      className="w-16 px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={timeUnit}
                      onChange={(e) => setTimeUnit(e.target.value as any)}
                      className="text-sm border border-blue-500 rounded px-1 py-0.5 focus:outline-none bg-white"
                    >
                      <option value="minute">分钟</option>
                      <option value="hour">小时</option>
                      <option value="day">天</option>
                      <option value="week">周</option>
                      <option value="month">月</option>
                    </select>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingTime(true)}
                    className="flex items-center cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 rounded transition-colors"
                    title="点击修改耗时"
                  >
                    <span>{task.timeSpent || 0} {
                      {
                        'minute': '分钟',
                        'hour': '小时',
                        'day': '天',
                        'week': '周',
                        'month': '月'
                      }[task.timeUnit || 'minute']
                    }</span>
                    <Pencil size={12} className="ml-1 opacity-0 group-hover/time:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!task.completed && !isSameDay(new Date(task.taskTime || task.createdAt), new Date()) && (
              <button
                onClick={() => onUpdateTask(task.id, { taskTime: Date.now() })}
                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                title="移动到今天"
              >
                移动到今天
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">动态与笔记</h3>
          
          {task.notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic">
              暂无笔记，在下方添加一条吧！
            </div>
          ) : (
            <div className="space-y-4">
              {task.notes.map((note) => (
                <div key={note.id} className="flex gap-3 group">
                  <div className="flex-col items-center hidden sm:flex">
                    <div className="w-2 h-2 rounded-full bg-blue-200 mt-2"></div>
                    <div className="w-0.5 flex-1 bg-gray-100 my-1 group-last:hidden"></div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 group/note relative">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editNoteContent}
                          onChange={(e) => setEditNoteContent(e.target.value)}
                          className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelNoteEdit}
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => saveNoteEdit(note.id)}
                            className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-800 leading-relaxed text-sm overflow-hidden">
                          <ReactMarkdown
                            components={{
                              code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '')
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
                                )
                              }
                            }}
                          >
                            {note.content}
                          </ReactMarkdown>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 flex justify-between items-center">
                          <span>{format(note.createdAt, 'yyyy年M月d日 • aa h:mm', { locale: zhCN })}</span>
                        </div>
                        
                        {/* Edit/Delete Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                          <button
                            onClick={() => setFullScreenNote({ id: note.id, content: note.content })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="全屏浏览/编辑"
                          >
                            <Maximize2 size={14} />
                          </button>
                          <button
                            onClick={() => startEditingNote(note)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="编辑笔记"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteNote(task.id, note.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="删除笔记"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Add Note */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <form onSubmit={handleAddNote} className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onPaste={handlePaste}
              placeholder="输入笔记... (支持 Markdown，可直接粘贴图片)"
              className="w-full pl-4 pr-20 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y shadow-sm"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
            />
            
            <div className="absolute right-2 bottom-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsMarkdownEditorOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="全屏编辑 (Markdown)"
              >
                <Maximize2 size={20} />
              </button>
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
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="上传图片"
              >
                <ImageIcon size={20} />
              </button>
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>

        <MarkdownEditorModal
          isOpen={isMarkdownEditorOpen}
          onClose={() => setIsMarkdownEditorOpen(false)}
          initialValue={newNote}
          onSave={(content) => setNewNote(content)}
        />

        <MarkdownEditorModal
          isOpen={!!fullScreenNote}
          onClose={() => setFullScreenNote(null)}
          initialValue={fullScreenNote?.content || ''}
          initialMode="preview"
          onSave={(content) => {
            if (fullScreenNote) {
              onUpdateNote(task.id, fullScreenNote.id, content);
              setFullScreenNote(null);
            }
          }}
        />

      </div>
    </div>
  );
};

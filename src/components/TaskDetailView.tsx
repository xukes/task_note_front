import React, { useState, useRef, useEffect } from 'react';
import { Task, Note } from '../types';
import { Send, Pencil, Trash2, CheckCircle2, Timer, Maximize2, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MarkdownEditorModal } from './MarkdownEditorModal';

interface TaskDetailViewProps {
  task: Task;
  onClose: () => void;
  onAddNote: (taskId: number, content: string) => void;
  onUpdateTitle: (taskId: number, title: string) => void;
  onUpdateTask: (taskId: number, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: number) => void;
  onDeleteNote: (taskId: number, noteId: number) => void;
  onUpdateNote: (taskId: number, noteId: number, content: string) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({ 
  task, 
  onClose, 
  onAddNote, 
  onUpdateTitle,
  onUpdateTask,
  onDeleteTask,
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
  const notesListRef = useRef<HTMLDivElement>(null);
  const prevNotesLengthRef = useRef(task.notes.length);

  useEffect(() => {
    if (notesListRef.current && task.notes.length > prevNotesLengthRef.current) {
      notesListRef.current.scrollTop = notesListRef.current.scrollHeight;
    }
    prevNotesLengthRef.current = task.notes.length;
  }, [task.notes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMarkdownEditorOpen) {
          setIsMarkdownEditorOpen(false);
        } else if (fullScreenNote) {
          setFullScreenNote(null);
        } else if (editingNoteId !== null) {
          cancelNoteEdit();
        } else if (isEditingTitle) {
          setIsEditingTitle(false);
        } else if (isEditingTime) {
          setIsEditingTime(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isMarkdownEditorOpen, fullScreenNote, editingNoteId, isEditingTitle, isEditingTime]);

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

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTitle(task.id, title.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(task.id, newNote.trim());
      setNewNote('');
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
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: formData
            });
            if (response.ok) {
              const data = await response.json();
              const imageUrl = `${import.meta.env.VITE_API_URL}${data.url}`;
              const imageMarkdown = `![image](${imageUrl})`;
              
              const textarea = e.target as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const text = newNote;
              const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
              setNewNote(newText);
              
              // Restore cursor position (approximate)
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
              }, 0);
            }
          } catch (error) {
            console.error('Upload failed:', error);
          }
        }
        break;
      }
    }
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  const saveNoteEdit = () => {
    if (editingNoteId !== null && editNoteContent.trim()) {
      onUpdateNote(task.id, editingNoteId, editNoteContent.trim());
      setEditingNoteId(null);
      setEditNoteContent('');
    }
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
    setEditNoteContent('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={onClose}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">返回列表</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
           <span>按 ESC 退出</span>
           <button
             onClick={() => onDeleteTask(task.id)}
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
             title="删除任务"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <button
              onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
              className={`mt-1.5 flex-shrink-0 transition-colors ${
                task.completed ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
            
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 text-xl font-bold border-b-2 border-blue-500 focus:outline-none px-1 py-0.5"
                    autoFocus
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  />
                </div>
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className={`text-xl font-bold cursor-pointer hover:text-blue-600 transition-colors ${
                    task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
                  }`}
                >
                  {task.title}
                </h2>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>创建于 {format(task.createdAt, 'yyyy年M月d日 HH:mm', { locale: zhCN })}</span>
                </div>
                
                {/* Time Tracking */}
                <div className="flex items-center gap-1">
                  <Timer size={14} />
                  {isEditingTime ? (
                    <div className="flex items-center gap-1 bg-white border rounded px-1">
                      <input
                        type="number"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        onBlur={handleTimeBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleTimeBlur()}
                        className="w-16 text-xs border-none focus:ring-0 p-0 text-right"
                        placeholder="0"
                        autoFocus
                      />
                      <select
                        value={timeUnit}
                        onChange={(e) => setTimeUnit(e.target.value as any)}
                        onBlur={handleTimeBlur}
                        className="text-xs border-none focus:ring-0 p-0 bg-transparent cursor-pointer"
                      >
                        <option value="minute">分钟</option>
                        <option value="hour">小时</option>
                        <option value="day">天</option>
                        <option value="week">周</option>
                        <option value="month">月</option>
                      </select>
                    </div>
                  ) : (
                    <span 
                      onClick={() => setIsEditingTime(true)}
                      className="cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 rounded transition-colors"
                    >
                      {task.timeSpent ? `${task.timeSpent} ${
                        task.timeUnit === 'minute' ? '分钟' :
                        task.timeUnit === 'hour' ? '小时' :
                        task.timeUnit === 'day' ? '天' :
                        task.timeUnit === 'week' ? '周' : '月'
                      }` : '记录耗时'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            笔记 ({task.notes.length})
          </h3>
          
          <div className="space-y-4" ref={notesListRef}>
            {task.notes.map((note) => (
              <div key={note.id} className="group bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">
                    {format(note.createdAt, 'M月d日 HH:mm', { locale: zhCN })}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setFullScreenNote({id: note.id, content: note.content})}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="全屏查看"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={() => startEditingNote(note)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteNote(task.id, note.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelNoteEdit}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                      >
                        取消
                      </button>
                      <button
                        onClick={saveNoteEdit}
                        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown
                      components={{
                        code(props: any) {
                          const {children, className, node, ...rest} = props
                          const match = /language-(\w+)/.exec(className || '')
                          return match ? (
                            <SyntaxHighlighter
                              {...rest}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code {...rest} className={className}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Note Input */}
          <div className="relative mt-4">
            <div className="absolute top-2 right-2 flex gap-2">
               <button
                onClick={() => setIsMarkdownEditorOpen(true)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="全屏编辑"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddNote();
                }
              }}
              onPaste={handlePaste}
              placeholder="添加笔记 (支持 Markdown，Ctrl+Enter 发送，支持粘贴图片)"
              className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[100px] transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                支持 Markdown 语法
              </span>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                发送
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Editor Modal */}
      <MarkdownEditorModal
        isOpen={isMarkdownEditorOpen}
        onClose={() => setIsMarkdownEditorOpen(false)}
        initialValue={newNote}
        onSave={(content) => {
          setNewNote(content);
          // Optionally auto-send if needed, but user might want to review
          setIsMarkdownEditorOpen(false);
        }}
      />

      {/* Full Screen Note View Modal */}
      {fullScreenNote && (
        <MarkdownEditorModal
          isOpen={true}
          onClose={() => setFullScreenNote(null)}
          initialValue={fullScreenNote.content}
          onSave={(content) => {
            onUpdateNote(task.id, fullScreenNote.id, content);
            setFullScreenNote(null);
          }}
          initialMode="preview"
        />
      )}
    </div>
  );
};
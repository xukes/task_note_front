import React, { useState, useEffect,useRef } from 'react';
import { Task, Note } from '../types';
import { Send, Pencil, Trash2, CheckCircle2, Timer, Maximize2, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { MarkdownEditorModal } from './MarkdownEditorModal';

interface TaskDetailViewProps {
  task: Task;
  onClose: () => void;
  onUpdateTitle: (id: number, title: string) => void;
  onUpdateTask: (id: number, updates: Partial<Task>) => void;
  onDeleteTask: (id: number) => void;
  onAddNote: (taskId: number, content: string) => void;
  onDeleteNote: (taskId: number, noteId: number) => void;
  onUpdateNote: (taskId: number, noteId: number, content: string) => void;
  // 新增：当用户点击全屏编辑时触发
  onEditNote: (note: Note) => void; 
}


export function TaskDetailView({ 
  task, 
  onClose, 
  onUpdateTitle,
  onDeleteTask,
  onUpdateTask,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onEditNote 
}: TaskDetailViewProps) {
  // const [title, setTitle] = useState(task.title);
  const [newNoteContent, setNewNoteContent] = useState('');
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
    setTitle(task.title);
  }, [task]);

  const handleTitleBlur = () => {
    if (title.trim() !== task.title) {
      onUpdateTitle(task.id, title);
    }
  };
  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTitle(task.id, title.trim());
    }
    setIsEditingTitle(false);
  };
  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(task.id, newNoteContent);
      setNewNoteContent('');
    }
  };
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
              const text = newNoteContent;
              const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
              setNewNoteContent(newText);
              
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

  return (
    <div className="h-full flex flex-col">
      {/* ... 顶部导航栏保持不变 ... */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={onClose} className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回列表
        </button>
        <button 
          onClick={() => onDeleteTask(task.id)} 
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="删除任务"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        {/* ... 标题区域保持不变 ... */}
        
        <div className="flex items-start gap-4 mb-8">
            {/* ... checkbox and title input ... */}
          
            {/* ... */}
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
        </div>


        {/* 笔记列表区域 */}
        <div className="space-y-6">
         {task.notes.map((note) => (
            <div key={note.id} className="group bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-all overflow-hidden">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
                <span>{format(new Date(note.createdAt), 'MM月dd日 HH:mm', { locale: zhCN })}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditNote(note)} // 这里触发切换视图
                    className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="全屏编辑"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(task.id, note.id)}
                    className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除笔记"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600 overflow-wrap-anywhere whitespace-pre-wrap">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {/* 添加新笔记输入框 */}
          <div className="relative">
             
            <textarea
              value={newNote}
              onChange={(e) => setNewNoteContent(e.target.value)}
              
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
                disabled={!newNoteContent.trim()}
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
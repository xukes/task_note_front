import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { Send, Trash2, Maximize2, CheckCircle2, Timer, ArrowLeft, Calendar } from 'lucide-react';
import { format,isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

interface TaskDetailViewProps {
  task: Task;
  onClose: () => void;
  onUpdateTitle: (id: number, title: string) => void;
  onUpdateTask: (id: number, updates: Partial<Task>) => void;
  onDeleteTask: (id: number) => void;
  onAddNote: (taskId: number, content: string) => void;
  onDeleteNote: (taskId: number, noteId: number) => void;
  onUpdateNote: (taskId: number, noteId: number, content: string) => void;
  onOpenNoteEditor: (initialValue: string, onSave: (content: string) => void, title: string) => void;
}

export function TaskDetailView({
  task,
  onClose,
  onUpdateTitle,
  onUpdateTask,
  onDeleteTask,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onOpenNoteEditor
}: TaskDetailViewProps) {
  const [title, setTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeSpent, setTimeSpent] = useState(task.timeSpent?.toString() || '');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour' | 'day' | 'week' | 'month'>(task.timeUnit || 'minute');
  const [newNoteContent, setNewNoteContent] = useState('');
  const timeEditRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setTimeSpent(task.timeSpent?.toString() || '');
    setTimeUnit(task.timeUnit || 'minute');
  }, [task]);

  const handleTitleSave = () => {
    if (title.trim() && title.trim() !== task.title) {
      onUpdateTitle(task.id, title.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    onAddNote(task.id, newNoteContent);
    setNewNoteContent('');
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
    } else {
      setTimeSpent(task.timeSpent?.toString() || '');
      setTimeUnit(task.timeUnit || 'minute');
    }
    setIsEditingTime(false);
  };

  const scheduleTimeBlur = () => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (timeEditRef.current && activeElement && timeEditRef.current.contains(activeElement)) {
        return;
      }
      handleTimeBlur();
    }, 0);
  };

  const formatUnit = () => {
    if (!task.timeSpent) return '记录耗时';
    const unit = task.timeUnit;
    return `${task.timeSpent} ${
      unit === 'minute' ? '分钟' :
      unit === 'hour' ? '小时' :
      unit === 'day' ? '天' :
      unit === 'week' ? '周' :
      '月'
    }`;
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const imageMarkdown = `![image](${reader.result})`;
          setNewNoteContent((prev) => prev + imageMarkdown);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={onClose} className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回列表
        </button>
        <div className="flex items-center gap-3">
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
            onClick={() => onDeleteTask(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除任务"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex items-start gap-4 mb-2">
            <div className="flex items-start gap-3 mb-2">
              <button
                onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
                className={`mt-1.5 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
              <div className="flex-1">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                    className="w-full text-xl font-bold border-b-2 border-blue-500 focus:outline-none px-1 py-0.5"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className={`text-xl font-bold cursor-pointer hover:text-blue-600 transition-colors ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                  >
                    {task.title}
                  </h2>
                )}
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>任务时间 {format(task.taskTime || task.createdAt, 'yyyy年M月d日 HH:mm', { locale: zhCN })}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Calendar size={14} className="text-green-600" />
                      <span>完成时间 {format(task.completedAt, 'yyyy年M月d日 HH:mm', { locale: zhCN })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Timer size={14} />
                    {isEditingTime ? (
                      <div ref={timeEditRef} className="flex items-center gap-1 bg-white border rounded px-1">
                        <input
                          type="number"
                          value={timeSpent}
                          onChange={(e) => setTimeSpent(e.target.value)}
                          onBlur={scheduleTimeBlur}
                          onKeyDown={(e) => e.key === 'Enter' && handleTimeBlur()}
                          className="w-16 text-xs border-none focus:ring-0 p-0 text-right"
                          placeholder="0"
                          autoFocus
                        />
                        <select
                          value={timeUnit}
                          onChange={(e) => setTimeUnit(e.target.value as any)}
                          onBlur={scheduleTimeBlur}
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
                        {formatUnit()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div className="space-y-6">
          {task.notes.map((note) => (
            <div key={note.id} className="group bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-all overflow-hidden">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
                <span>{format(new Date(note.createdAt), 'MM月dd日 HH:mm', { locale: zhCN })}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onOpenNoteEditor(note.content, (content) => onUpdateNote(task.id, note.id, content), '编辑笔记')}
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
                <ReactMarkdown remarkPlugins={[remarkGfm] as PluggableList}>{note.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          <div className="relative">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
              onPaste={handlePaste}
              placeholder="添加笔记 (支持 Markdown，Ctrl+Enter 发送，支持粘贴图片)"
              className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[100px] transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex  items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenNoteEditor(newNoteContent, (content) => setNewNoteContent(content), '新建笔记')}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="全屏编辑"
                >
                  <Maximize2 size={18} />
                </button>
                <span className="text-xs text-gray-400">支持 Markdown 语法</span>
              </div>
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
    </div>
  );
}

import React, { useState } from 'react';
import { Task } from '../types';
import { Check, Trash2, Square, Pencil, X, Save, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdateTitle: (id: number, title: string) => void;
  onClick: (task: Task) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdateTitle, 
  onClick,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const commitEdit = () => {
    if (editTitle.trim()) {
      onUpdateTitle(task.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    commitEdit();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      commitEdit();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();
    
    if (isCurrentYear) {
      return format(date, 'M月d日', { locale: zhCN });
    }
    return format(date, 'yyyy年M月d日', { locale: zhCN });
  };

  if (isEditing) {
    return (
      <div className="p-4 mb-2 bg-white rounded-lg shadow-sm border border-blue-200 ring-2 ring-blue-100">
          <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleEditKeyDown}
          className="w-full mb-2 px-2 py-1 text-lg font-medium border-b border-gray-200 focus:outline-none focus:border-blue-500"
          placeholder="任务标题"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} />
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick(task)}
      className={`group flex items-start justify-between p-4 mb-2 bg-white rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-all ${task.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`mt-1 p-1 rounded-full transition-colors ${task.completed ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {task.completed ? <Check size={20} /> : <Square size={20} />}
        </button>
        <div className="flex-1">
          <span className={`text-lg block ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">
              {formatDate(task.createdAt)}
            </span>
            {task.notes.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                <MessageSquare size={12} />
                {task.notes.length} {task.notes.length === 1 ? '条笔记' : '条笔记'}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && !isFirst && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            title="上移"
          >
            <ArrowUp size={18} />
          </button>
        )}
        {onMoveDown && !isLast && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            title="下移"
          >
            <ArrowDown size={18} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
          aria-label="Edit task"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

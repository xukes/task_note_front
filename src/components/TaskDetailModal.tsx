import React, { useState } from 'react';
import { Task, Note } from '../types';
import { X, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onAddNote: (taskId: string, content: string) => void;
  onUpdateTitle: (taskId: string, title: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onAddNote, onUpdateTitle }) => {
  const [newNote, setNewNote] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(task.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() !== task.title) {
      onUpdateTitle(task.id, title.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
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
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock size={14} />
              Created {format(task.createdAt, 'PP p')}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body - Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Activity & Notes</h3>
          
          {task.notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic">
              No notes yet. Add one below!
            </div>
          ) : (
            <div className="space-y-4">
              {task.notes.map((note) => (
                <div key={note.id} className="flex gap-3 group">
                  <div className="flex-col items-center hidden sm:flex">
                    <div className="w-2 h-2 rounded-full bg-blue-200 mt-2"></div>
                    <div className="w-0.5 flex-1 bg-gray-100 my-1 group-last:hidden"></div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      {format(note.createdAt, 'MMM d, yyyy • h:mm a')}
                    </div>
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
              placeholder="Type a note..."
              className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="absolute right-2 bottom-2.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

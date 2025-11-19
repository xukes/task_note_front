import React from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { format } from 'date-fns';

interface SidebarTaskListProps {
  date: Date;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onTaskClick: (task: Task) => void;
}

export const SidebarTaskList: React.FC<SidebarTaskListProps> = ({ date, tasks, onToggle, onDelete, onUpdateTitle, onTaskClick }) => {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-700 mb-3 px-1">
        Tasks for {format(date, 'MMM d')}
      </h3>
      {tasks.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No tasks for this date
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdateTitle={onUpdateTitle}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

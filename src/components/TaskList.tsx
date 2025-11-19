import React from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onTaskClick: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onUpdateTitle, onTaskClick }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        暂无任务，在上方添加一个吧！
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
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
  );
};

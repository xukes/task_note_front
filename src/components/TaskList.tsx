import React from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdateTitle: (id: number, title: string) => void;
  onTaskClick: (task: Task) => void;
  onOrderChange?: (newTasks: Task[]) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onUpdateTitle, onTaskClick, onOrderChange }) => {
  const [draggedTaskId, setDraggedTaskId] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: number) => {
    e.preventDefault();
    if (draggedTaskId === null || draggedTaskId === targetTaskId || !onOrderChange) return;

    const draggedTaskIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetTaskIndex = tasks.findIndex(t => t.id === targetTaskId);
    
    if (draggedTaskIndex === -1 || targetTaskIndex === -1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedTaskIndex, 1);
    
    // We need to adjust target index because removing the dragged item might shift indices
    // But findIndex on the original 'tasks' gives us the stable ID based position.
    // Let's just use the target ID to find where to insert in the *new* array (minus the dragged item).
    
    let insertIndex = newTasks.findIndex(t => t.id === targetTaskId);
    
    if (!isTopHalf) {
        insertIndex += 1;
    }
    
    newTasks.splice(insertIndex, 0, draggedItem);
    
    onOrderChange(newTasks);
    setDraggedTaskId(null);
  };

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
        <div
          key={task.id}
          draggable={!!onOrderChange}
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, task.id)}
          className={`transition-all duration-200 ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
        >
          <TaskItem
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdateTitle={onUpdateTitle}
            onClick={onTaskClick}
          />
        </div>
      ))}
    </div>
  );
};

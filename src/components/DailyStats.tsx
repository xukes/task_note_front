import React from 'react';
import { Task } from '../types';
import { PieChart, CheckCircle2, Circle } from 'lucide-react';

interface DailyStatsProps {
  tasks: Task[];
}

export const DailyStats: React.FC<DailyStatsProps> = ({ tasks }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.taskTime || task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const total = todaysTasks.length;
  const completed = todaysTasks.filter(t => t.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <PieChart size={20} />
          <span className="font-medium">进度</span>
        </div>
        <div className="text-2xl font-bold text-blue-700">{progress}%</div>
        <div className="text-xs text-blue-500">今日完成率</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
        <div className="flex items-center gap-2 text-green-600 mb-1">
          <CheckCircle2 size={20} />
          <span className="font-medium">已完成</span>
        </div>
        <div className="text-2xl font-bold text-green-700">{completed}</div>
        <div className="text-xs text-green-500">完成任务数</div>
      </div>

      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2 text-purple-600 mb-1">
          <Circle size={20} />
          <span className="font-medium">总计</span>
        </div>
        <div className="text-2xl font-bold text-purple-700">{total}</div>
        <div className="text-xs text-purple-500">今日任务总数</div>
      </div>
    </div>
  );
};

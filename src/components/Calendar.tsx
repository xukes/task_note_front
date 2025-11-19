import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';

interface CalendarProps {
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks, selectedDate, onSelectDate, onMonthChange }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const nextMonth = () => {
    const newDate = addMonths(currentMonth, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const prevMonth = () => {
    const newDate = subMonths(currentMonth, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: zhCN });
  const endDate = endOfWeek(monthEnd, { locale: zhCN });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStats = (date: Date) => {
    const dayTasks = tasks.filter(task => isSameDay(new Date(task.taskTime || task.createdAt), date));
    return {
      total: dayTasks.length,
      completed: dayTasks.filter(t => t.completed).length,
      incomplete: dayTasks.filter(t => !t.completed).length
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">
          {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
        </h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500 font-medium">
        <div>日</div>
        <div>一</div>
        <div>二</div>
        <div>三</div>
        <div>四</div>
        <div>五</div>
        <div>六</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const stats = getDayStats(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`
                h-14 rounded-lg flex flex-col items-center justify-start pt-1 transition-all relative
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 z-10' : 'hover:bg-gray-50'}
                ${isDayToday && !isSelected ? 'bg-blue-50/50 font-semibold text-blue-600' : ''}
              `}
            >
              <span className="text-sm">{format(day, 'd')}</span>
              
              {stats.total > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {stats.incomplete > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" title={`${stats.incomplete} 待办`} />
                  )}
                  {stats.completed > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" title={`${stats.completed} 已完成`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

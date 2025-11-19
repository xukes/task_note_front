import { useState, useEffect } from 'react';
import { Task, Note } from './types';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { DailyStats } from './components/DailyStats';
import { Calendar } from './components/Calendar';
import { SidebarTaskList } from './components/SidebarTaskList';
import { TaskDetailModal } from './components/TaskDetailModal';
import { LayoutList } from 'lucide-react';
import { isSameDay } from 'date-fns';

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Convert old 'note' string to 'notes' array
      return parsed.map((t: any) => {
        if (t.note && (!t.notes || t.notes.length === 0)) {
          return {
            ...t,
            notes: [{
              id: crypto.randomUUID(),
              content: t.note,
              createdAt: t.createdAt
            }],
            note: undefined // Clean up old field
          };
        }
        return { ...t, notes: t.notes || [] };
      });
    }
    return [];
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (title: string, noteContent: string) => {
    const notes: Note[] = noteContent ? [{
      id: crypto.randomUUID(),
      content: noteContent,
      createdAt: Date.now()
    }] : [];

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      notes,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, completed: !prev.completed } : null);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  const updateTaskTitle = (id: string, title: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, title } : task
    ));
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, title } : null);
    }
  };

  const addNoteToTask = (taskId: string, content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      createdAt: Date.now()
    };

    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, notes: [...task.notes, newNote] } : task
    ));

    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, notes: [...prev.notes, newNote] } : null);
    }
  };

  // Filter tasks for "Today" view (Center)
  const todayTasks = tasks.filter(task => isSameDay(new Date(task.createdAt), new Date()));
  const activeTasksCount = todayTasks.filter(t => !t.completed).length;

  // Filter tasks for "Selected Date" view (Sidebar)
  const selectedDateTasks = tasks.filter(task => isSameDay(new Date(task.createdAt), selectedDate));

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        
        {/* Left Sidebar */}
        <div className="space-y-6">
          <Calendar 
            tasks={tasks} 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
          />
          <SidebarTaskList 
            date={selectedDate}
            tasks={selectedDateTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdateTitle={updateTaskTitle}
            onTaskClick={setSelectedTask}
          />
        </div>

        {/* Main Content (Center) */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit">
          <div className="p-6 bg-blue-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <LayoutList size={32} />
              <h1 className="text-2xl font-bold">今日专注</h1>
            </div>
            <p className="text-blue-100">
              今天还有 {activeTasksCount} 个待办任务
            </p>
          </div>
          
          <div className="p-6">
            <DailyStats tasks={tasks} />
            <AddTaskForm onAdd={addTask} />
            <TaskList 
              tasks={todayTasks} 
              onToggle={toggleTask} 
              onDelete={deleteTask} 
              onUpdateTitle={updateTaskTitle}
              onTaskClick={setSelectedTask}
            />
          </div>
        </div>

      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAddNote={addNoteToTask}
          onUpdateTitle={updateTaskTitle}
        />
      )}
    </div>
  );
}

export default App;

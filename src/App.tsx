import { useState, useEffect } from 'react';
import { Task, Note } from './types';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { DailyStats } from './components/DailyStats';
import { Calendar } from './components/Calendar';
import { SidebarTaskList } from './components/SidebarTaskList';
import { TaskDetailModal } from './components/TaskDetailModal';
import { LayoutList, LogOut } from 'lucide-react';
import { isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { zhCN } from 'date-fns/locale';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { api } from './api';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isRegistering, setIsRegistering] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleLogin = (newToken: string, newUsername: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setViewMonth(new Date()); // Reset view to today on login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setTasks([]);
  };

  useEffect(() => {
    if (token) {
      // Calculate the range displayed on the calendar
      // Calendar displays from startOfWeek(startOfMonth) to endOfWeek(endOfMonth)
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { locale: zhCN });
      const endDate = endOfWeek(monthEnd, { locale: zhCN });

      api.fetchTasks(startDate.getTime(), endDate.getTime())
        .then(setTasks)
        .catch(err => {
          console.error(err);
          if (err.message.includes('401')) {
            handleLogout();
          }
        });
    }
  }, [token, viewMonth]);

  const addTask = async (title: string, noteContent: string) => {
    try {
      const newTask: Task = {
        id: uuidv4(),
        title,
        notes: [],
        completed: false,
        createdAt: Date.now(),
      };
      
      const createdTask = await api.createTask(newTask);
      
      if (noteContent) {
        const note: Note = {
          id: uuidv4(),
          content: noteContent,
          createdAt: Date.now()
        };
        const createdNote = await api.createNote(createdTask.id, note);
        createdTask.notes = [createdNote];
      }

      setTasks(prev => [createdTask, ...prev]);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('添加任务失败');
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updated = await api.toggleTask(id);
      // Preserve notes as updateTask might not return them fully populated depending on backend
      // But our api wrapper tries to handle it. 
      // Let's just update the local state optimistically or with result
      setTasks(tasks.map(t => t.id === id ? { 
        ...t, 
        completed: updated.completed,
        completedAt: updated.completedAt 
      } : t));
      
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { 
          ...prev, 
          completed: updated.completed,
          completedAt: updated.completedAt
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updatedTask = await api.updateTask(id, updates);
      setTasks(tasks.map(t =>
        t.id === id ? { ...updatedTask, notes: t.notes } : t
      ));
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...updatedTask, notes: prev.notes } : null);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const updateTaskTitle = async (id: string, title: string) => {
    await updateTask(id, { title });
  };


  const addNoteToTask = async (taskId: string, content: string) => {
    try {
      const newNote: Note = {
        id: uuidv4(),
        content,
        createdAt: Date.now()
      };

      const createdNote = await api.createNote(taskId, newNote);

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, notes: [...task.notes, createdNote] } : task
      ));

      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, notes: [...prev.notes, createdNote] } : null);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const deleteNote = async (taskId: string, noteId: string) => {
    try {
      await api.deleteNote(noteId);
      
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            notes: task.notes.filter(n => n.id !== noteId)
          };
        }
        return task;
      }));

      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: prev.notes.filter(n => n.id !== noteId)
          };
        });
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const updateNote = async (taskId: string, noteId: string, content: string) => {
    try {
      const updatedNote = await api.updateNote(noteId, content);

      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            notes: task.notes.map(n => n.id === noteId ? updatedNote : n)
          };
        }
        return task;
      }));

      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: prev.notes.map(n => n.id === noteId ? updatedNote : n)
          };
        });
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Filter tasks for "Today" view (Center)
  const todayTasks = tasks.filter(task => isSameDay(new Date(task.createdAt), new Date()));
  const activeTasksCount = todayTasks.filter(t => !t.completed).length;

  // Filter tasks for "Selected Date" view (Sidebar)
  const selectedDateTasks = tasks.filter(task => isSameDay(new Date(task.createdAt), selectedDate));

  if (!token) {
    if (isRegistering) {
      return (
        <RegisterPage 
          onRegisterSuccess={() => setIsRegistering(false)} 
          onSwitchToLogin={() => setIsRegistering(false)} 
        />
      );
    }
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onSwitchToRegister={() => setIsRegistering(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <LayoutList className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">TaskNote</h1>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-gray-600">你好, {username}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
              <LogOut size={18} />
              退出
            </button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        
        {/* Left Sidebar */}
        <div className="space-y-6">
          <Calendar 
            tasks={tasks} 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate}
            onMonthChange={setViewMonth}
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
          onUpdateTask={updateTask}
          onDeleteNote={deleteNote}
          onUpdateNote={updateNote}
        />
      )}
    </div>
  );
}

export default App;

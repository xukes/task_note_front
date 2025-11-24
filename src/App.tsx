import { useState, useEffect } from 'react';
import { Task,  TaskStat } from './types';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { DailyStats } from './components/DailyStats';
import { Calendar } from './components/Calendar';
import { SidebarTaskList } from './components/SidebarTaskList';
import { TaskDetailView } from './components/TaskDetailView'; // 引入新组件
import { UserProfileModal } from './components/UserProfileModal';
import { LayoutList, LogOut, User } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { SearchBox } from './components/SearchBox';
import { api } from './api';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const [monthlyStats, setMonthlyStats] = useState<TaskStat[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  
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
    setMonthlyStats([]);
    setTodayTasks([]);
    setSelectedDateTasks([]);
  };

  // Fetch monthly stats for calendar
  useEffect(() => {
    if (token) {
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { locale: zhCN });
      const endDate = endOfWeek(monthEnd, { locale: zhCN });

      api.fetchTaskStats(startDate.getTime(), endDate.getTime())
        .then(setMonthlyStats)
        .catch(err => {
          console.error(err);
          if (err.message.includes('401')) {
            handleLogout();
          }
        });
    }
  }, [token, viewMonth]);

  // Fetch today's tasks on load
  useEffect(() => {
    if (token) {
      const today = new Date();
      const start = startOfDay(today).getTime();
      const end = endOfDay(today).getTime();
      
      api.fetchTasks(start, end)
        .then(setTodayTasks)
        .catch(console.error);
    }
  }, [token]);

  // Fetch selected date tasks
  useEffect(() => {
    if (token) {
      const start = startOfDay(selectedDate).getTime();
      const end = endOfDay(selectedDate).getTime();
      
      api.fetchTasks(start, end)
        .then(setSelectedDateTasks)
        .catch(console.error);
    }
  }, [token, selectedDate]);

  const refreshData = () => {
    // Refresh all data
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: zhCN });
    const endDate = endOfWeek(monthEnd, { locale: zhCN });

    api.fetchTaskStats(startDate.getTime(), endDate.getTime())
      .then(setMonthlyStats)
      .catch(console.error);

    const today = new Date();
    api.fetchTasks(startOfDay(today).getTime(), endOfDay(today).getTime())
      .then(setTodayTasks)
      .catch(console.error);

    api.fetchTasks(startOfDay(selectedDate).getTime(), endOfDay(selectedDate).getTime())
      .then(setSelectedDateTasks)
      .catch(console.error);
  };

  const addTask = async (title: string, noteContent: string) => {
    try {
      const newTask = {
        title,
        notes: [],
        completed: false,
        createdAt: Date.now(),
        taskTime: Date.now() // Default to now
      };
      
      const createdTask = await api.createTask(newTask);
      
      if (noteContent) {
        await api.createNote(createdTask.id, noteContent);
      }

      refreshData();
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('添加任务失败');
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const updated = await api.toggleTask(id);
      
      // Optimistic update or just refresh
      // Since we have multiple lists (today, selected date), refreshing is safer but slower.
      // Let's update local state for responsiveness then refresh stats
      
      const updateList = (list: Task[]) => list.map(t => t.id === id ? { 
        ...t, 
        completed: updated.completed,
        completedAt: updated.completedAt 
      } : t);

      setTodayTasks(updateList);
      setSelectedDateTasks(updateList);
      
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { 
          ...prev, 
          completed: updated.completed,
          completedAt: updated.completedAt
        } : null);
      }

      // Refresh stats to update calendar counts
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { locale: zhCN });
      const endDate = endOfWeek(monthEnd, { locale: zhCN });
      api.fetchTaskStats(startDate.getTime(), endDate.getTime())
        .then(setMonthlyStats);

    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.deleteTask(id);
      setTodayTasks(prev => prev.filter(t => t.id !== id));
      setSelectedDateTasks(prev => prev.filter(t => t.id !== id));
      
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
      
      // Refresh stats
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { locale: zhCN });
      const endDate = endOfWeek(monthEnd, { locale: zhCN });
      api.fetchTaskStats(startDate.getTime(), endDate.getTime())
        .then(setMonthlyStats);

    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      const updatedTask = await api.updateTask(id, updates);
      
      // If taskTime changed, we might need to move it from lists
      // For simplicity, let's refresh everything if taskTime changed
      if (updates.taskTime) {
        refreshData();
      } else {
        const updateList = (list: Task[]) => list.map(t => t.id === id ? { ...updatedTask, notes: t.notes } : t);
        setTodayTasks(updateList);
        setSelectedDateTasks(updateList);
      }

      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...updatedTask, notes: prev.notes } : null);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const updateTaskTitle = async (id: number, title: string) => {
    await updateTask(id, { title });
  };

  const handleOrderChange = async (newTasks: Task[]) => {
    // Re-assign sort orders based on new index
    const updatedTasks = newTasks.map((t, index) => ({
      ...t,
      sortOrder: (index + 1) * 100
    }));
    
    setTodayTasks(updatedTasks);

    // Find tasks that actually changed order and update them
    // Actually, since we re-index everything, we might need to update many.
    // But usually only the moved task and maybe neighbors need update if we were doing linked list.
    // Here we just update everyone whose sortOrder changed.
    
    const updates = updatedTasks.filter(t => {
       const original = todayTasks.find(old => old.id === t.id);
       return original && original.sortOrder !== t.sortOrder;
    });

    // Send updates in parallel
    try {
      await Promise.all(updates.map(t => 
        api.updateTask(t.id, { sortOrder: t.sortOrder })
      ));
    } catch (error) {
      console.error("Failed to update order", error);
      refreshData();
    }
  };


  const addNoteToTask = async (taskId: number, content: string) => {
    try {
      const createdNote = await api.createNote(taskId, content);

      const updateList = (list: Task[]) => list.map(task =>
        task.id === taskId ? { ...task, notes: [...task.notes, createdNote] } : task
      );
      setTodayTasks(updateList);
      setSelectedDateTasks(updateList);

      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, notes: [...prev.notes, createdNote] } : null);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const deleteNote = async (taskId: number, noteId: number) => {
    try {
      await api.deleteNote(noteId);
      
      const updateList = (list: Task[]) => list.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            notes: task.notes.filter(n => n.id !== noteId)
          };
        }
        return task;
      });
      setTodayTasks(updateList);
      setSelectedDateTasks(updateList);

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

  const updateNote = async (taskId: number, noteId: number, content: string) => {
    try {
      const updatedNote = await api.updateNote(noteId, content);

      const updateList = (list: Task[]) => list.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            notes: task.notes.map(n => n.id === noteId ? updatedNote : n)
          };
        }
        return task;
      });
      setTodayTasks(updateList);
      setSelectedDateTasks(updateList);

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

  const activeTasksCount = todayTasks.filter(t => !t.completed).length;

  if (!token) {
    if (isRegistering) {
      return (
        <RegisterPage 
          onRegisterSuccess={() => setIsRegistering(false)} 
          onSwitchToLogin={() => setIsRegistering(false)} 
        />
      );
    }
    if (isResettingPassword) {
      return (
        <ResetPasswordPage
          onSuccess={() => setIsResettingPassword(false)}
          onBackToLogin={() => setIsResettingPassword(false)}
        />
      );
    }
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onSwitchToRegister={() => setIsRegistering(true)} 
        onSwitchToResetPassword={() => setIsResettingPassword(true)}
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
            <button 
              onClick={() => setIs2FAModalOpen(true)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="User Profile"
            >
              <User size={18} />
            </button>
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
            stats={monthlyStats} 
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit min-h-[600px]">
          {selectedTask ? (
            <TaskDetailView
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onAddNote={addNoteToTask}
              onUpdateTitle={updateTaskTitle}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onDeleteNote={deleteNote}
              onUpdateNote={updateNote}
            />
          ) : (
            <>
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
                <SearchBox onTaskClick={setSelectedTask} />
                <DailyStats tasks={todayTasks} />
                <AddTaskForm onAdd={addTask} />
                <TaskList 
                  tasks={todayTasks} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                  onUpdateTitle={updateTaskTitle}
                  onTaskClick={setSelectedTask}
                  onOrderChange={handleOrderChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <UserProfileModal 
        isOpen={is2FAModalOpen} 
        onClose={() => setIs2FAModalOpen(false)}
        username={username}
      />
    </div>
  );
}

export default App;

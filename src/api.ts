import { Task, Note, TaskStat } from './types';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const api = {
  fetchTasks: async (startDate?: number, endDate?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toString());
    if (endDate) params.append('end_date', endDate.toString());

    const response = await fetch(`${API_URL}/tasks?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    // Backend now returns timestamps directly
    return data.map((task: any) => ({
      ...task,
      createdAt: task.created_at, // Already number
      completedAt: task.completed_at, // Already number or null
      timeSpent: task.time_spent, // Map snake_case to camelCase
      timeUnit: task.time_unit, // Map snake_case to camelCase
      taskTime: task.task_time,
      sortOrder: task.sort_order,
      highlights: task.highlights,
      notes: (task.notes || []).map((note: any) => ({
        ...note,
        createdAt: new Date(note.created_at).getTime()
      }))
    }));
  },

  fetchTaskStats: async (startDate: number, endDate: number): Promise<TaskStat[]> => {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toString());
    params.append('end_date', endDate.toString());

    const response = await fetch(`${API_URL}/tasks/stats?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch task stats');
    const data = await response.json();
    return data.map((stat: any) => ({
      date: stat.date,
      totalCount: stat.total_count,
      unCompletedCount: stat.un_completed_count
    }));
  },

  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'notes'>): Promise<Task> => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title: task.title,
        completed: task.completed,
        time_spent: task.timeSpent,
        time_unit: task.timeUnit,
        task_time: task.taskTime
      })
    });
    if (!response.ok) throw new Error('Failed to create task');
    const data = await response.json();
    return {
      ...data,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      timeSpent: data.time_spent,
      timeUnit: data.time_unit,
      taskTime: data.task_time,
      notes: []
    };
  },

  updateTask: async (id: number, updates: Partial<Task>): Promise<Task> => {
    // Convert camelCase to snake_case for backend
    const backendUpdates: any = { ...updates };
    if (updates.timeSpent !== undefined) {
      backendUpdates.time_spent = updates.timeSpent;
      delete backendUpdates.timeSpent;
    }
    if (updates.timeUnit !== undefined) {
      backendUpdates.time_unit = updates.timeUnit;
      delete backendUpdates.timeUnit;
    }
    if (updates.taskTime !== undefined) {
      backendUpdates.task_time = updates.taskTime;
      delete backendUpdates.taskTime;
    }
    if (updates.sortOrder !== undefined) {
      backendUpdates.sort_order = updates.sortOrder;
      delete backendUpdates.sortOrder;
    }

    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(backendUpdates)
    });
    if (!response.ok) throw new Error('Failed to update task');
    const data = await response.json();
    return {
      ...data,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      timeSpent: data.time_spent,
      timeUnit: data.time_unit,
      taskTime: data.task_time,
      notes: data.notes || []
    };
  },

  toggleTask: async (id: number): Promise<Task> => {
    const response = await fetch(`${API_URL}/tasks/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to toggle task');
    const data = await response.json();
    return {
      ...data,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      timeSpent: data.time_spent,
      timeUnit: data.time_unit,
      taskTime: data.task_time,
      notes: data.notes || []
    };
  },

  deleteTask: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  createNote: async (taskId: number, content: string): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        task_id: taskId,
        content: content
      })
    });
    if (!response.ok) throw new Error('Failed to create note');
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type is automatically set by browser for FormData
      },
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.url;
  },

  updateNote: async (id: number, content: string): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update note');
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  deleteNote: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete note');
  },

  searchTasks: async (query: string): Promise<Task[]> => {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to search tasks');
    const data = await response.json();
    return data.map((task: any) => ({
      ...task,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      timeSpent: task.time_spent,
      timeUnit: task.time_unit,
      taskTime: task.task_time,
      sortOrder: task.sort_order,
      notes: (task.notes || []).map((note: any) => ({
        ...note,
        createdAt: new Date(note.created_at).getTime()
      }))
    }));
  }
};

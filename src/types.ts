export interface Note {
  id: number;
  content: string;
  createdAt: number;
}

export interface Task {
  id: number;
  title: string;
  notes: Note[];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  timeSpent?: number; // Time spent value
  timeUnit?: 'minute' | 'hour' | 'day' | 'week' | 'month'; // Time unit
  taskTime?: number; // Task time as timestamp (milliseconds)
  sortOrder?: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

export interface TaskStat {
  date: string;
  totalCount: number;
  unCompletedCount: number;
}

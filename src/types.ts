export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  notes: Note[];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  timeSpent?: number; // Time spent value
  timeUnit?: 'minute' | 'hour' | 'day' | 'week' | 'month'; // Time unit
}

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
}

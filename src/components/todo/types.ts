export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  deadline?: Date;
  completedAt?: Date;
  projectId: string;
};

export type Project = {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
}

export type Filter = "all" | "pending" | "completed" | "history";

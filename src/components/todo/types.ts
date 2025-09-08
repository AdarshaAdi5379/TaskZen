export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  deadline?: Date;
};

export type Filter = "all" | "pending" | "completed";

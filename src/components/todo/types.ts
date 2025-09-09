
export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  deadline?: Date;
  completedAt?: Date;
  projectId: string;
  assignedTo?: string; // UID of the user the task is assigned to
  // For soft deletes
  deletedAt?: Date | null;
  deletedBy?: string | null;
  // For dependencies
  isBlocked?: boolean;
  dependsOn?: string[];
};

export type ProjectMember = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export type Project = {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  membersInfo?: ProjectMember[];
  companyId: string; // Link to the parent company
}

export type Filter = "all" | "pending" | "completed" | "history";

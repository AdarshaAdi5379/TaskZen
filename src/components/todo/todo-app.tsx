
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Todo, Filter, Project, ProjectMember } from './types';
import { TodoForm } from './todo-form';
import { TodoList } from './todo-list';
import { TodoFilters } from './todo-filters';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { TaskZenIcon } from './taskzen-icon';
import { Button } from '../ui/button';
import { useAuth } from '@/components/auth/auth-context';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch, onSnapshot, orderBy, Timestamp, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { HistoryView } from './history-view';
import { ProjectSelector } from './project-selector';
import { CalendarSync } from 'lucide-react';
import { syncToCalendar } from '@/ai/flows/calendar-sync-flow';
import { interpretTask } from '@/ai/flows/interpret-task-flow';
import { QuickAddWidget } from './quick-add-widget';

async function migrateUserTasks(userId: string, defaultProjectId: string) {
    const db = getFirebaseDb();
    const oldTodosRef = collection(db, 'users', userId, 'todos');
    const oldTodosSnap = await getDocs(oldTodosRef);
    
    if (!oldTodosSnap.empty) {
        const batch = writeBatch(db);
        oldTodosSnap.docs.forEach(oldDoc => {
            const oldTodoData = oldDoc.data();
            const newTodoData = {
                ...oldTodoData,
                projectId: defaultProjectId,
                createdAt: oldTodoData.createdAt instanceof Timestamp ? oldTodoData.createdAt.toDate() : new Date(),
            };
            const newTodoRef = doc(collection(db, 'projects', defaultProjectId, 'tasks'), oldDoc.id);
            batch.set(newTodoRef, newTodoData);
            batch.delete(oldDoc.ref); // Delete the old todo
        });
        await batch.commit();
        console.log("Migration completed for user:", userId);
    }
}

async function fetchProjectMembers(memberIds: string[]): Promise<ProjectMember[]> {
    if (memberIds.length === 0) return [];
    const db = getFirebaseDb();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "in", memberIds));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: data.uid,
            displayName: data.displayName,
            photoURL: data.photoURL,
            email: data.email,
        }
    });
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setProjects([]);
        setTodos([]);
        setCurrentProjectId(null);
        return;
    }

    setLoading(true);
    const db = getFirebaseDb();
    const projectsQuery = query(collection(db, 'projects'), where('members', 'array-contains', user.uid), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(projectsQuery, async (snapshot) => {
        let userProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        
        if (userProjects.length === 0) {
            const newProject = {
                name: 'Personal',
                ownerId: user.uid,
                members: [user.uid],
                createdAt: new Date(),
            };
            try {
                const projectRef = await addDoc(collection(db, 'projects'), newProject);
                const newProjectWithId = { ...newProject, id: projectRef.id };
                userProjects.push(newProjectWithId);
                await migrateUserTasks(user.uid, projectRef.id);
            } catch (error) {
                console.error("Error creating initial project:", error);
                toast({ title: "Error", description: "Could not create your initial project.", variant: "destructive" });
                setLoading(false);
                return;
            }
        }
        
        const projectsWithMembers = await Promise.all(userProjects.map(async (p) => {
            const membersInfo = await fetchProjectMembers(p.members);
            return { ...p, membersInfo };
        }));

        setProjects(projectsWithMembers);
        
        if (!currentProjectId || !projectsWithMembers.some(p => p.id === currentProjectId)) {
            setCurrentProjectId(projectsWithMembers[0]?.id || null);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching projects:", error);
        toast({ title: "Error", description: "Could not fetch projects.", variant: "destructive" });
        setLoading(false);
    });

    return unsubscribe;
  }, [user, toast]);

  useEffect(() => {
    if (!currentProjectId || !user) {
        setTodos([]);
        return;
    };
    const db = getFirebaseDb();
    const todosQuery = query(collection(db, 'projects', currentProjectId, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
        const todosData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : (data.deadline ? new Date(data.deadline) : undefined),
                completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : undefined),
            } as Todo;
        });
        setTodos(todosData);
    }, (error) => {
        console.error("Error fetching todos:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });

    return unsubscribe;
  }, [currentProjectId, user, toast]);

  const addTodo = async (text: string, deadline?: Date) => {
    if (!currentProjectId || !user) return;
    try {
        let taskText = text;
        let taskDeadline = deadline;

        // If no deadline is manually set, try to parse it with AI
        if (!deadline) {
            const interpretedTask = await interpretTask({ text });
            taskText = interpretedTask.text;
            if (interpretedTask.deadline) {
                taskDeadline = new Date(interpretedTask.deadline);
            }
        }
        
        const newTodo: Omit<Todo, 'id'> = {
          text: taskText,
          completed: false,
          createdAt: new Date(),
          deadline: taskDeadline,
          projectId: currentProjectId,
        };
        const db = getFirebaseDb();
        await addDoc(collection(db, 'projects', currentProjectId, 'tasks'), newTodo);

    } catch (error) {
        console.error("Error adding todo:", error);
        toast({ title: "Error", description: "Failed to add task.", variant: "destructive" });
    }
  };

  const toggleTodo = async (id: string) => {
    if (!currentProjectId) return;
    const todoToToggle = todos.find(todo => todo.id === id);
    if (!todoToToggle) return;

    const isCompleted = !todoToToggle.completed;
    const updatedTodoData = { 
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : undefined
    };

    try {
        const db = getFirebaseDb();
        await updateDoc(doc(db, 'projects', currentProjectId, 'tasks', id), updatedTodoData);
    } catch (error) {
        console.error("Error toggling todo:", error);
        toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
    }
  };

  const deleteTodo = async (id: string) => {
    if (!currentProjectId) return;
    try {
        const db = getFirebaseDb();
        await deleteDoc(doc(db, 'projects', currentProjectId, 'tasks', id));
    } catch (error) {
        console.error("Error deleting todo:", error);
        toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  const assignTask = async (id: string, userId: string) => {
    if (!currentProjectId) return;
     try {
        const db = getFirebaseDb();
        await updateDoc(doc(db, 'projects', currentProjectId, 'tasks', id), { assignedTo: userId });
    } catch (error) {
        console.error("Error assigning task:", error);
        toast({ title: "Error", description: "Failed to assign task.", variant: "destructive" });
    }
  }

  const createProject = async (projectName: string) => {
    if(!user) return;
    try {
      const db = getFirebaseDb();
      const newProject = {
        name: projectName,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: new Date(),
      };
      const projectRef = await addDoc(collection(db, 'projects'), newProject);
      // The onSnapshot listener will automatically update the projects list.
      // We just need to switch to the new project.
      setCurrentProjectId(projectRef.id);
      toast({title: "Success", description: `Project "${projectName}" created.`});
    } catch (error) {
       console.error("Error creating project:", error);
       toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
    }
  }

  const shareProject = async (email: string) => {
    if (!currentProjectId || !user) return;

    if(email === user.email) {
      toast({ title: "You can't share a project with yourself.", variant: "destructive" });
      return;
    }

    try {
      const db = getFirebaseDb();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Error", description: "User with that email not found.", variant: "destructive" });
        return;
      }

      const userToShareWith = querySnapshot.docs[0].data();
      const projectRef = doc(db, 'projects', currentProjectId);

      await updateDoc(projectRef, {
        members: arrayUnion(userToShareWith.uid)
      });
      
      toast({ title: "Success", description: `Project shared with ${email}.` });

    } catch (error) {
      console.error("Error sharing project:", error);
      toast({ title: "Error", description: "Failed to share project.", variant: "destructive" });
    }
  }

  const handleSyncToCalendar = async () => {
    if (!currentProjectId) return;
    setIsSyncing(true);
    try {
      const tasksToSync = todos.filter(t => t.projectId === currentProjectId && t.deadline && !t.completed);
      const result = await syncToCalendar(tasksToSync);
      toast({
        title: "Sync Successful",
        description: `${result.syncedEvents} tasks have been synced to your Google Calendar.`
      });
    } catch (error) {
       console.error("Error syncing to calendar:", error);
       toast({ title: "Sync Error", description: "Could not sync tasks to Google Calendar.", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  }

  const filteredTodos = useMemo(() => {
    const activeTodos = todos.filter(todo => todo.projectId === currentProjectId);
    const sortedTodos = [...activeTodos].sort((a,b) => (a.createdAt && b.createdAt) ? b.createdAt.getTime() - a.createdAt.getTime() : 0);
    switch (filter) {
      case 'pending':
        return sortedTodos.filter(todo => !todo.completed);
      case 'completed':
        return sortedTodos.filter(todo => todo.completed);
      case 'history':
        return sortedTodos.filter(todo => todo.completed);
      default:
        return sortedTodos.filter(todo => !todo.completed); // Default to showing pending tasks
    }
  }, [todos, filter, currentProjectId]);
  
  const pendingCount = useMemo(() => todos.filter(t => t.projectId === currentProjectId && !t.completed).length, [todos, currentProjectId]);
  const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);

  return (
    <>
      <Card className="w-full max-w-lg shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2 z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
              <TaskZenIcon className="h-8 w-8 text-primary" />
              <CardTitle className="text-4xl font-bold tracking-tight">TaskZen</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
           <div className="px-2 space-y-4">
            <ProjectSelector 
              projects={projects}
              currentProject={currentProject}
              onSelectProject={setCurrentProjectId}
              onCreateProject={createProject}
              onShareProject={shareProject}
            />
            {filter !== 'history' &&
                <TodoForm onAddTodo={addTodo} />
            }
          </div>
          
          <div className="mt-4 min-h-[24rem]">
            { filter === 'history' ? (
              <HistoryView completedTodos={todos.filter(t => t.projectId === currentProjectId && t.completed)} />
            ) : (
              <TodoList 
                todos={filteredTodos} 
                onToggleTodo={toggleTodo} 
                onDeleteTodo={deleteTodo} 
                onAssignTask={assignTask}
                members={currentProject?.membersInfo || []}
                loading={loading}
              />
            )}
          </div>
        </CardContent>
        {todos.length > 0 && (
            <CardFooter className="flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <span>{pendingCount} tasks left</span>
                </div>
                <div className="flex-grow flex justify-center">
                    <TodoFilters filter={filter} onSetFilter={setFilter} />
                </div>
                 <Button variant="outline" size="sm" onClick={handleSyncToCalendar} disabled={isSyncing}>
                    <CalendarSync className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="ml-2 hidden sm:inline">
                      {isSyncing ? "Syncing..." : "Sync to Calendar"}
                    </span>
                </Button>
            </CardFooter>
        )}
      </Card>
      <QuickAddWidget onAddTodo={addTodo} currentProjectId={currentProjectId} />
    </>
  );
}

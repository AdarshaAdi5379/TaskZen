"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Todo, Filter } from './types';
import { TodoForm } from './todo-form';
import { TodoList } from './todo-list';
import { TodoFilters } from './todo-filters';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { TaskZenIcon } from './taskzen-icon';
import { Button } from '../ui/button';
import { useAuth } from '@/components/auth/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const getTodos = useCallback(async () => {
    if (!user) {
      try {
        const storedTodos = localStorage.getItem('todos');
        if (storedTodos) {
          setTodos(JSON.parse(storedTodos).map((t: any) => ({...t, deadline: t.deadline ? new Date(t.deadline) : undefined, createdAt: t.createdAt ? new Date(t.createdAt): undefined })));
        }
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    const todosCollection = collection(db, 'users', user.uid, 'todos');
    const q = query(todosCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data,
          id: doc.id,
          // Firestore Timestamps need to be converted to JS Dates
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : data.deadline,
        } as Todo
      });
      setTodos(todosData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching todos:", error);
      toast({
        title: "Error",
        description: "Could not fetch tasks. Please try again later.",
        variant: "destructive"
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [user, toast]);

  useEffect(() => {
    const unsubscribePromise = getTodos();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [getTodos]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('todos', JSON.stringify(todos));
      } catch (error) {
        console.error("Failed to save todos to localStorage", error);
      }
    }
  }, [todos, user]);

  const addTodo = async (text: string, deadline?: Date) => {
    const newTodo: Todo = {
      id: doc(collection(db, 'temp')).id,
      text,
      completed: false,
      createdAt: new Date(),
      deadline: deadline,
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'todos', newTodo.id), newTodo);
      } catch (error) {
        console.error("Error adding todo:", error);
        toast({ title: "Error", description: "Failed to add task.", variant: "destructive" });
      }
    } else {
      setTodos([newTodo, ...todos]);
    }
  };

  const toggleTodo = async (id: string) => {
    const todoToToggle = todos.find(todo => todo.id === id);
    if (!todoToToggle) return;

    const updatedTodo = { ...todoToToggle, completed: !todoToToggle.completed };

    if (user) {
        try {
            await setDoc(doc(db, 'users', user.uid, 'todos', id), updatedTodo, { merge: true });
        } catch (error) {
            console.error("Error toggling todo:", error);
            toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
        }
    } else {
        setTodos(
            todos.map(todo => (todo.id === id ? updatedTodo : todo))
        );
    }
  };

  const deleteTodo = async (id: string) => {
    if (user) {
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'todos', id));
        } catch (error) {
            console.error("Error deleting todo:", error);
            toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
        }
    } else {
        setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  const clearCompleted = async () => {
    if (user) {
        const batch = writeBatch(db);
        const completedTodos = todos.filter(todo => todo.completed);
        completedTodos.forEach(todo => {
            const todoRef = doc(db, 'users', user.uid, 'todos', todo.id);
            batch.delete(todoRef);
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error clearing completed todos:", error);
            toast({ title: "Error", description: "Failed to clear completed tasks.", variant: "destructive" });
        }
    } else {
        setTodos(todos.filter(todo => !todo.completed));
    }
  };

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'pending':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);
  
  const pendingCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.length - pendingCount, [todos, pendingCount]);

  return (
    <Card className="w-full max-w-lg shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-2">
            <TaskZenIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-4xl font-bold tracking-tight">TaskZen</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="px-2">
          <TodoForm onAddTodo={addTodo} />
        </div>
        <div className="mt-4 min-h-[24rem]">
          <TodoList todos={filteredTodos} onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo} loading={loading} />
        </div>
      </CardContent>
      {todos.length > 0 && (
          <CardFooter className="flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground border-t pt-4">
              <span>{pendingCount} tasks left</span>
              <div className="hidden md:block">
                  <TodoFilters filter={filter} onSetFilter={setFilter} />
              </div>
              <Button onClick={clearCompleted} variant="ghost" className="hover:text-primary disabled:opacity-50" disabled={completedCount === 0}>Clear completed</Button>
          </CardFooter>
      )}
      {todos.length > 0 && (
          <div className="md:hidden border-t p-4 flex justify-center items-center text-sm text-muted-foreground">
              <TodoFilters filter={filter} onSetFilter={setFilter} />
          </div>
      )}
    </Card>
  );
}

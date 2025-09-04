"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Todo, Filter } from './types';
import { TodoForm } from './todo-form';
import { TodoList } from './todo-list';
import { TodoFilters } from './todo-filters';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { TaskZenIcon } from './taskzen-icon';
import { Button } from '../ui/button';

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem('todos');
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error("Failed to parse todos from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      console.error("Failed to save todos to localStorage", error);
    }
  }, [todos]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };
    setTodos([newTodo, ...todos]);
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
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
          <TodoList todos={filteredTodos} onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo} />
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

"use client";

import { AnimatePresence, motion } from 'framer-motion';
import type { Todo } from './types';
import { TodoItem } from './todo-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  loading: boolean;
}

export function TodoList({ todos, onToggleTodo, onDeleteTodo, loading }: TodoListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
        <p className="text-lg font-medium">You're all caught up!</p>
        <p className="text-sm">Add a new task to get started.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 pr-4">
      <ul className="space-y-2">
        <AnimatePresence>
          {todos.map(todo => (
            <motion.li
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <TodoItem todo={todo} onToggle={onToggleTodo} onDelete={onDeleteTodo} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </ScrollArea>
  );
}

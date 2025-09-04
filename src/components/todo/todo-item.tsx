"use client";

import type { Todo } from './types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        aria-labelledby={`todo-label-${todo.id}`}
        className="size-5 rounded-full data-[state=checked]:bg-accent data-[state=checked]:border-accent"
      />
      <label
        id={`todo-label-${todo.id}`}
        className={cn(
          "flex-grow cursor-pointer transition-colors break-all",
          todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'
        )}
        htmlFor={`todo-${todo.id}`}
      >
        {todo.text}
      </label>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete task: ${todo.text}`}
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

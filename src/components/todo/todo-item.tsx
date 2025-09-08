"use client";

import type { Todo } from './types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const deadlineDate = todo.deadline ? new Date((todo.deadline as any).seconds * 1000) : null;
  
  const isOverdue = deadlineDate && !todo.completed ? new Date() > deadlineDate : false;

  return (
    <div className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        aria-labelledby={`todo-label-${todo.id}`}
        className="size-5 rounded-full data-[state=checked]:bg-accent data-[state=checked]:border-accent mt-1"
      />
      <div className="flex-grow">
        <label
          id={`todo-label-${todo.id}`}
          className={cn(
            "cursor-pointer transition-colors break-all",
            todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
          htmlFor={`todo-${todo.id}`}
        >
          {todo.text}
        </label>
        {deadlineDate && (
          <div className={cn(
            "text-xs flex items-center mt-1",
            isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
            <CalendarIcon className="h-3 w-3 mr-1.5" />
            <span>{format(deadlineDate, 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 shrink-0"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete task: ${todo.text}`}
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

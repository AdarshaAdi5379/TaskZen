"use client";

import type { Todo, ProjectMember } from './types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, User, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, userId: string) => void;
  members: ProjectMember[];
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
}


export function TodoItem({ todo, onToggle, onDelete, onAssign, members }: TodoItemProps) {
  const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
  const isOverdue = deadlineDate && !todo.completed ? new Date() > deadlineDate : false;
  const assignedUser = members.find(m => m.uid === todo.assignedTo);

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

      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
           <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            {assignedUser ? (
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={assignedUser.photoURL || ''} alt={assignedUser.displayName || ''} />
                                    <AvatarFallback>{getInitials(assignedUser.displayName)}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{assignedUser ? `Assigned to ${assignedUser.displayName}`: 'Assign task'}</p>
                </TooltipContent>
            </Tooltip>
           </TooltipProvider>
          <DropdownMenuContent>
            {members.map(member => (
              <DropdownMenuItem key={member.uid} onSelect={() => onAssign(todo.id, member.uid)}>
                <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={member.photoURL || ''} alt={member.displayName || ''} />
                    <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                </Avatar>
                <span>{member.displayName}</span>
              </DropdownMenuItem>
            ))}
             <DropdownMenuItem onSelect={() => onAssign(todo.id, '')}>
                <User className="h-4 w-4 mr-2" />
                <span>Unassign</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
    </div>
  );
}

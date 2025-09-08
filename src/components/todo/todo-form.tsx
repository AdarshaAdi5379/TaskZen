"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Wand2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TodoFormProps {
  onAddTodo: (text: string, deadline?: Date) => void;
}

export function TodoForm({ onAddTodo }: TodoFormProps) {
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim(), deadline);
      setText('');
      setDeadline(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
      <div className="relative flex-grow">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Try "Call John tomorrow at 5pm"'
          className="flex-grow bg-muted/50 focus:bg-background pl-10"
          aria-label="New task"
        />
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Use AI to set deadlines automatically!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[150px] justify-start text-left font-normal",
                !deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, "PPP") : <span>Set deadline</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button type="submit" aria-label="Add task">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TodoForm } from './todo-form';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '../auth/auth-context';

interface QuickAddWidgetProps {
  onAddTodo: (text: string, deadline?: Date) => void;
  currentProjectId: string | null;
}

export function QuickAddWidget({ onAddTodo, currentProjectId }: QuickAddWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const handleAddTodo = (text: string, deadline?: Date) => {
    onAddTodo(text, deadline);
    setIsOpen(false); // Close the sheet after adding a task
  };
  
  // Only render the widget if on mobile and a project is selected
  if (!isMobile || !currentProjectId || !user) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Task</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>Add a new task</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <TodoForm onAddTodo={handleAddTodo} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

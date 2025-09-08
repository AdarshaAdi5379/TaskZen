"use client";

import { useMemo } from "react";
import type { Todo } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, CheckCircle, BarChart, Calendar } from "lucide-react";

interface HistoryViewProps {
  completedTodos: Todo[];
}

function calculateStreak(todos: Todo[]): number {
  if (todos.length === 0) return 0;

  const completionDates = todos
    .map(t => t.completedAt)
    .filter((d): d is Date => !!d)
    .map(d => d.toISOString().split('T')[0]);
  
  const uniqueDates = [...new Set(completionDates)].sort().reverse();

  if (uniqueDates.length === 0) return 0;
  
  let streak = 0;
  let today = new Date();
  
  const lastCompletionDate = new Date(uniqueDates[0]);
  const diffInDays = (today.getTime() - lastCompletionDate.getTime()) / (1000 * 3600 * 24);

  // If the last completion was not today or yesterday, streak is 0
  if (diffInDays > 1.5) { 
      return 0;
  }

  streak = 1;
  if(uniqueDates.length === 1) return streak;
  
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const previous = new Date(uniqueDates[i+1]);
    const diff = (current.getTime() - previous.getTime()) / (1000 * 3600 * 24);

    if (diff <= 1.5) { // Allow for some timezone flexibility
      streak++;
    } else {
      break;
    }
  }

  // If last completion was yesterday, and today has no completion, today is part of streak.
  const todayStr = today.toISOString().split('T')[0];
  if (!uniqueDates.includes(todayStr) && diffInDays <= 1.5 && diffInDays > 0.5) {
      // no change needed, streak already counts the last day.
  }

  return streak;
}


export function HistoryView({ completedTodos }: HistoryViewProps) {
  const stats = useMemo(() => {
    const totalCompleted = completedTodos.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const completedToday = completedTodos.filter(t => t.completedAt && new Date(t.completedAt) >= today).length;
    const completedThisWeek = completedTodos.filter(t => t.completedAt && new Date(t.completedAt) >= startOfWeek).length;

    const streak = calculateStreak(completedTodos);

    return { totalCompleted, completedToday, completedThisWeek, streak };
  }, [completedTodos]);

  const StatCard = ({ icon, title, value, unit }: { icon: React.ReactNode, title: string, value: string | number, unit?: string }) => (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
            {value} 
            {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard 
            icon={<Flame className="h-4 w-4 text-muted-foreground" />} 
            title="Productivity Streak"
            value={stats.streak}
            unit={stats.streak === 1 ? 'day' : 'days'}
        />
        <StatCard 
            icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} 
            title="Total Tasks Completed"
            value={stats.totalCompleted}
        />
        <StatCard 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            title="Completed Today"
            value={stats.completedToday}
        />
        <StatCard 
            icon={<BarChart className="h-4 w-4 text-muted-foreground" />} 
            title="Completed This Week"
            value={stats.completedThisWeek}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Completed Tasks</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {completedTodos.length > 0 ? (
                completedTodos.map(todo => (
                    <div key={todo.id} className="text-sm p-2 bg-muted/30 rounded-md flex justify-between items-center">
                        <span className="text-muted-foreground line-through">{todo.text}</span>
                        <span className="text-xs text-muted-foreground">
                            {todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : ''}
                        </span>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No completed tasks yet.</p>
            )}
        </div>
      </div>
    </div>
  );
}

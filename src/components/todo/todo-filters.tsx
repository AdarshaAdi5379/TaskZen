"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Filter } from './types';

interface TodoFiltersProps {
  filter: Filter;
  onSetFilter: (filter: Filter) => void;
}

export function TodoFilters({ filter, onSetFilter }: TodoFiltersProps) {
  return (
    <Tabs value={filter} onValueChange={(value) => onSetFilter(value as Filter)} className="w-full max-w-xs">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

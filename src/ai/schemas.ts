/**
 * @fileOverview This file contains the Zod schemas and TypeScript types for the AI flows.
 * By centralizing schemas here, we avoid "use server" directive conflicts in Next.js.
 */
import { z } from 'zod';

// Schemas for interpret-task-flow.ts
export const InterpretTaskInputSchema = z.object({
  text: z.string().describe('The natural language text for the task.'),
});
export type InterpretTaskInput = z.infer<typeof InterpretTaskInputSchema>;

export const InterpretTaskOutputSchema = z.object({
  text: z.string().describe('The extracted task description.'),
  deadline: z
    .string()
    .optional()
    .describe('The deadline in ISO 8601 format if present, otherwise undefined.'),
});
export type InterpretTaskOutput = z.infer<typeof InterpretTaskOutputSchema>;


// Schemas for calendar-sync-flow.ts
export const CalendarSyncInputSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    deadline: z.date().optional(),
    projectId: z.string(),
  })
);
export type CalendarSyncInput = z.infer<typeof CalendarSyncInputSchema>;

export const CalendarSyncOutputSchema = z.object({
  syncedEvents: z.number(),
});
export type CalendarSyncOutput = z.infer<typeof CalendarSyncOutputSchema>;

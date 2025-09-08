'use server';
/**
 * @fileOverview A Genkit flow for synchronizing tasks with Google Calendar.
 *
 * - syncToCalendar - A function that takes a list of tasks and creates events in Google Calendar.
 * - CalendarSyncInput - The input type for the syncToCalendar function.
 * - CalendarSyncOutput - The return type for the syncToCalendar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { getGoogleAccessToken } from '@genkit-ai/next/auth';
import { google } from 'googleapis';
import type { Todo } from '@/components/todo/types';

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

export async function syncToCalendar(
  input: CalendarSyncInput
): Promise<CalendarSyncOutput> {
  return syncToCalendarFlow(input);
}

const syncToCalendarFlow = ai.defineFlow(
  {
    name: 'syncToCalendarFlow',
    inputSchema: CalendarSyncInputSchema,
    outputSchema: CalendarSyncOutputSchema,
  },
  async (tasks) => {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated with Google.');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let syncedEvents = 0;

    for (const task of tasks) {
      if (task.deadline) {
        const event = {
          summary: task.text,
          description: `Task from TaskZen. Project ID: ${task.projectId}`,
          start: {
            dateTime: task.deadline.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: new Date(task.deadline.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            timeZone: 'UTC',
          },
          // Use a unique ID to prevent duplicate events
          id: `taskzen${task.id.replace(/[^a-zA-Z0-9]/g, '')}`.substring(0, 1024),
        };

        try {
            // Use insert or patch (update) to avoid duplicates if event already exists.
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: event.id,
                requestBody: event,
            }).catch(async (err) => {
                if (err.code === 404) { // Not found, so insert it
                   await calendar.events.insert({
                        calendarId: 'primary',
                        requestBody: event,
                    });
                } else {
                    throw err;
                }
            })
            syncedEvents++;
        } catch (error) {
            console.error(`Failed to create/update event for task ${task.id}:`, error);
            // Decide if you want to throw or just log the error and continue
        }
      }
    }

    return { syncedEvents };
  }
);

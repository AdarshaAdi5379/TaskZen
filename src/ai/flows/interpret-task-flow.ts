'use server';
/**
 * @fileOverview A Genkit flow for interpreting natural language to create a task.
 *
 * - interpretTask - A function that takes a natural language string and returns a structured task object.
 * - InterpretTaskInput - The input type for the interpretTask function.
 * - InterpretTaskOutput - The return type for the interpretTask function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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

export async function interpretTask(
  input: InterpretTaskInput
): Promise<InterpretTaskOutput> {
  return interpretTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretTaskPrompt',
  input: { schema: InterpretTaskInputSchema },
  output: { schema: InterpretTaskOutputSchema },
  prompt: `You are an assistant that helps parse natural language into a structured task.
Analyze the following text and extract the core task description and a deadline.

The current date is ${new Date().toISOString()}.

If a date or time is mentioned, convert it to a precise ISO 8601 formatted string for the 'deadline' field.
The 'text' field should contain only the description of the task itself, without the date/time information.

For example:
- "Call John tomorrow at 5pm" -> { text: "Call John", deadline: "..." }
- "Finish report by Friday" -> { text: "Finish report", deadline: "..." }
- "Buy milk" -> { text: "Buy milk" }

Text to parse: {{{text}}}`,
});

const interpretTaskFlow = ai.defineFlow(
  {
    name: 'interpretTaskFlow',
    inputSchema: InterpretTaskInputSchema,
    outputSchema: InterpretTaskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

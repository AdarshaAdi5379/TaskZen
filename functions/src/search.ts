
/**
 * @fileoverview Cloud Functions for indexing data with a search provider like Algolia.
 */

import * as functions from 'firebase-functions';
import algoliasearch from 'algoliasearch';

// Initialize Algolia client
// IMPORTANT: Use environment variables for secrets
const client = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_KEY!);
const index = client.initIndex('tasks'); // Name of your Algolia index

// Function to index a task in Algolia when it's created or updated
export const indexTask = functions.firestore
    .document('projects/{projectId}/tasks/{taskId}')
    .onWrite(async (change, context) => {
        const taskId = context.params.taskId;
        const data = change.after.data();

        if (!change.after.exists || data?.deletedAt) {
            // Document was deleted (or soft-deleted), remove from Algolia
            return index.deleteObject(taskId);
        }

        // Only index the fields you need for searching
        const searchableData = {
            objectID: taskId,
            text: data.text,
            projectId: data.projectId,
            completed: data.completed,
            // Add any other fields you want to search/filter by
        };
        
        return index.saveObject(searchableData);
    });

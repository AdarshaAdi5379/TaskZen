
/**
 * @fileoverview Cloud Functions for UX/Ops improvements like bulk actions.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Callable function for bulk-closing tasks
export const bulkCloseTasks = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { projectId, taskIds } = data;
    if (!projectId || !Array.isArray(taskIds) || taskIds.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Valid projectId and taskIds array are required.');
    }
    
    // Add rate limiting for production apps
    
    // Add permissions check to ensure user is a member of the project

    const batch = db.batch();
    taskIds.forEach((taskId: string) => {
        const taskRef = db.doc(`projects/${projectId}/tasks/${taskId}`);
        batch.update(taskRef, {
            completed: true,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedBy: uid,
        });
    });

    await batch.commit();

    return { success: true, count: taskIds.length };
});

// Example for feature flag middleware (conceptual)
// This would be used in your Express app or Next.js middleware
export function checkFeatureFlag(companyFeatures: any, flagName: string): boolean {
    return companyFeatures?.[flagName] === true;
}

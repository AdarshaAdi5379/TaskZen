
/**
 * @fileoverview Cloud Functions for collaboration features like dependencies and templates.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// When a task's dependencies change, or a dependency's status changes, re-evaluate if the task is blocked.
export const onTaskDependencyChange = functions.firestore
    .document('projects/{projectId}/tasks/{taskId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const taskId = context.params.taskId;
        const projectId = context.params.projectId;

        // Check if dependencies were added/removed or if the task's own completion status changed.
        const dependenciesChanged = JSON.stringify(before.dependsOn) !== JSON.stringify(after.dependsOn);
        const completionChanged = before.completed !== after.completed;

        if (completionChanged && after.completed) {
            // If this task was just completed, check which other tasks depended on it and might now be unblocked.
            const dependentTasksQuery = db.collection(`projects/${projectId}/tasks`).where('dependsOn', 'array-contains', taskId);
            const snapshot = await dependentTasksQuery.get();
            const batch = db.batch();
            snapshot.forEach(doc => {
                // Trigger a re-evaluation for each dependent task by making a trivial update
                batch.update(doc.ref, { recomputeBlockers: admin.firestore.FieldValue.serverTimestamp() });
            });
            await batch.commit();
        }

        if (dependenciesChanged) {
            // If this task's dependencies have changed, check if it's now blocked.
            await recomputeIsBlocked(projectId, taskId);
        }
    });

/**
 * Recomputes the isBlocked status of a task based on its dependencies.
 * @param projectId The project ID.
 * @param taskId The task ID.
 */
async function recomputeIsBlocked(projectId: string, taskId: string) {
    const taskRef = db.doc(`projects/${projectId}/tasks/${taskId}`);
    const taskSnap = await taskRef.get();
    const taskData = taskSnap.data();

    if (!taskData || !taskData.dependsOn || taskData.dependsOn.length === 0) {
        return taskRef.update({ isBlocked: false });
    }

    const dependenciesRefs = taskData.dependsOn.map((depId: string) => db.doc(`projects/${projectId}/tasks/${depId}`));
    const dependenciesSnaps = await db.getAll(...dependenciesRefs);

    const isBlocked = dependenciesSnaps.some(depSnap => !depSnap.exists || !depSnap.data()?.completed);
    
    return taskRef.update({ isBlocked });
}


// HTTP endpoint to instantiate a template in a project
export const instantiateTemplate = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    
    const { companyId, projectId, templateId } = data;
    // Add validation and permissions checks here...

    const templateRef = db.doc(`companies/${companyId}/templates/${templateId}`);
    const templateSnap = await templateRef.get();
    
    if (!templateSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Template not found.');
    }
    const templateData = templateSnap.data()!;
    const batch = db.batch();
    
    // Create tasks from the template
    for (const task of templateData.tasks) {
        const newTaskRef = db.collection(`projects/${projectId}/tasks`).doc();
        batch.set(newTaskRef, {
            ...task,
            projectId: projectId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // any other default fields
        });
    }

    await batch.commit();
    return { success: true, tasksCreated: templateData.tasks.length };
});

// Time Tracking Endpoints
export const startTimeTracking = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

    const { projectId, taskId } = data;
    // Permissions checks...
    
    const timeLogRef = db.collection(`projects/${projectId}/tasks/${taskId}/timeLogs`).doc();
    await timeLogRef.set({
        userId: uid,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        endTime: null,
    });
    
    return { timeLogId: timeLogRef.id };
});

export const stopTimeTracking = functions.https.onCall(async (data, context) => {
     const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

    const { projectId, taskId, timeLogId } = data;
    // Permissions checks...

    const timeLogRef = db.doc(`projects/${projectId}/tasks/${taskId}/timeLogs/${timeLogId}`);
    await timeLogRef.update({
        endTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // You might trigger an aggregation function from here
    
    return { success: true };
});

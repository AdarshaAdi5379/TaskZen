
/**
 * @fileoverview Cloud Functions for admin-only tools.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Middleware to check for admin custom claim.
 * @param context The function context.
 */
function requireAdmin(context: functions.https.CallableContext) {
    if (context.auth?.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this operation.');
    }
}


// Admin endpoint to list all users
export const adminListUsers = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    
    const { pageToken } = data;
    try {
        const userRecords = await admin.auth().listUsers(100, pageToken);
        return {
            users: userRecords.users.map(u => ({
                uid: u.uid,
                email: u.email,
                displayName: u.displayName,
                disabled: u.disabled,
                customClaims: u.customClaims
            })),
            nextPageToken: userRecords.pageToken
        };
    } catch (error) {
        console.error("Error listing users:", error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});


// Admin endpoint to export tasks for a given project
export const adminExportTasks = functions.https.onCall(async (data, context) => {
    requireAdmin(context);

    const { projectId } = data;
    if (!projectId) {
        throw new functions.https.HttpsError('invalid-argument', 'A projectId is required.');
    }
    
    const db = admin.firestore();
    const tasksSnapshot = await db.collection(`projects/${projectId}/tasks`).get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // In a real app, you might format this as a CSV and upload to GCS, returning a signed URL.
    return { tasks };
});

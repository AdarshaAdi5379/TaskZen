
/**
 * @fileoverview Cloud Functions for audit logging.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface AuditLogEntry {
    timestamp: admin.firestore.FieldValue;
    actorId: string;
    action: string;
    target: {
        type: string;
        id: string;
    };
    changes?: any;
    context?: any;
}

/**
 * Helper function to create a new audit log entry.
 * @param companyId The ID of the company.
 * @param entry The audit log data.
 */
export async function recordAuditLog(companyId: string, entry: Omit<AuditLogEntry, 'timestamp'>) {
    const logData: AuditLogEntry = {
        ...entry,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('companies').doc(companyId).collection('auditLogs').add(logData);
}


// Function to log when a user's role changes.
export const onUserRoleChange = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (before.role !== after.role) {
            if (!after.companyId) {
                console.warn(`User ${context.params.userId} has no companyId. Skipping audit log.`);
                return;
            }

            await recordAuditLog(after.companyId, {
                // The actor is likely an admin, need a way to determine who made the change.
                // This might require a more sophisticated approach, like passing the actorId in the request that triggers the update.
                // For now, we'll assume a generic 'system' actor or the user themselves if possible.
                actorId: context.auth?.uid || 'system',
                action: 'user.role.update',
                target: {
                    type: 'user',
                    id: context.params.userId,
                },
                changes: {
                    from: before.role,
                    to: after.role,
                }
            });
        }
    });
    
// Function to log when a task is deleted (soft or hard).
export const onTaskDelete = functions.firestore
    .document('projects/{projectId}/tasks/{taskId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // Log soft-delete
        if (!before.deletedAt && after.deletedAt) {
             const projectSnap = await db.collection('projects').doc(context.params.projectId).get();
             const companyId = projectSnap.data()?.companyId;
             if (!companyId) return;

             await recordAuditLog(companyId, {
                actorId: after.deletedBy || 'system',
                action: 'task.delete.soft',
                target: {
                    type: 'task',
                    id: context.params.taskId
                },
                context: {
                    projectId: context.params.projectId,
                }
             });
        }
    });
    
// Function to log billing actions
export async function logBillingAction(companyId: string, actorId: string, action: string, details: any) {
    await recordAuditLog(companyId, {
        actorId: actorId,
        action: `billing.${action}`,
        target: {
            type: 'billing',
            id: companyId,
        },
        context: details
    });
}

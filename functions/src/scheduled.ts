
/**
 * @fileoverview Scheduled Cloud Functions for maintenance tasks.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Scheduled function to permanently purge soft-deleted documents
export const scheduledPurge = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const retentionDays = 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);

        const tasksQuery = db.collectionGroup('tasks').where('deletedAt', '<=', cutoff);
        const snapshot = await tasksQuery.get();

        if (snapshot.empty) {
            console.log("No documents to purge.");
            return null;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Purged ${snapshot.size} documents.`);
        return null;
    });
    
// Scheduled function to aggregate metrics daily
export const dailyMetricsAggregation = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const companiesSnap = await db.collection('companies').get();
        const promises = companiesSnap.docs.map(companyDoc => aggregateMetricsForCompany(companyDoc.id));
        await Promise.all(promises);
    });

async function aggregateMetricsForCompany(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const metricsRef = db.doc(`companies/${companyId}/metrics/${yesterday.toISOString().split('T')[0]}`);

    // This is a simplified example. A real implementation would need to query tasks across all projects for a company.
    const tasksCreatedQuery = db.collectionGroup('tasks').where('companyId', '==', companyId).where('createdAt', '>=', yesterday).where('createdAt', '<', today);
    const tasksCompletedQuery = db.collectionGroup('tasks').where('companyId', '==', companyId).where('completedAt', '>=', yesterday).where('completedAt', '<', today);

    const createdSnap = await tasksCreatedQuery.get();
    const completedSnap = await tasksCompletedQuery.get();

    const metrics = {
        tasksCreated: createdSnap.size,
        tasksCompleted: completedSnap.size,
        // avgResolution would require more complex calculation
    };
    
    await metricsRef.set(metrics, { merge: true });
}

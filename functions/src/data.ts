
/**
 * @fileoverview Cloud Functions for data management, like backups.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const db = admin.firestore();

// Scheduled function to export data from Firestore to Cloud Storage
export const dailyBackupExport = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const bucketName = `${process.env.GCLOUD_PROJECT}-backups`;
        const timestamp = new Date().toISOString();
        const exportPath = `backups/${timestamp}/`;
        
        const client = new admin.firestore.v1.FirestoreAdminClient();
        const databaseName = client.databasePath(process.env.GCLOUD_PROJECT!, '(default)');
        
        try {
            const [operation] = await client.exportDocuments({
                name: databaseName,
                outputUriPrefix: `gs://${bucketName}/${exportPath}`,
                // Leave collectionIds empty to export all collections
                collectionIds: [],
            });
            console.log(`Successfully started export operation: ${operation.name}`);
            return null;
        } catch (error) {
            console.error('Error starting backup export:', error);
            throw new Error('Export operation failed');
        }
    });

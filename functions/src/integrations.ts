
/**
 * @fileoverview Cloud Functions for third-party integrations (Slack, Jira) and webhook dispatching.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

// Webhook dispatcher that sends events to configured integrations
export const webhookDispatcher = functions.firestore
    .document('projects/{projectId}/tasks/{taskId}')
    .onWrite(async (change, context) => {
        const projectSnap = await db.doc(`projects/${context.params.projectId}`).get();
        const companyId = projectSnap.data()?.companyId;

        if (!companyId) return;

        const integrationsSnap = await db.collection(`companies/${companyId}/integrations`).where('enabled', '==', true).get();
        if (integrationsSnap.empty) return;
        
        let eventType = '';
        if (!change.before.exists) {
            eventType = 'task.created';
        } else if (!change.after.exists) {
            eventType = 'task.deleted';
        } else {
            eventType = 'task.updated';
        }
        
        const payload = {
            event: eventType,
            data: change.after.data() || change.before.data(),
            timestamp: admin.firestore.Timestamp.now().toMillis(),
            context: context.params,
        };

        const promises = integrationsSnap.docs.map(doc => {
            const integration = doc.data();
            return dispatchWebhookWithRetry(doc.id, integration, payload);
        });
        
        await Promise.all(promises);
    });

/**
 * Dispatches a webhook to a single integration with retry logic.
 * @param integrationId The ID of the integration document.
 * @param integration The integration configuration data.
 * @param payload The webhook payload.
 */
async function dispatchWebhookWithRetry(integrationId: string, integration: admin.firestore.DocumentData, payload: any) {
    let url = '';
    let body: any = {};

    // Prepare request based on integration type
    if (integration.type === 'slack') {
        url = integration.webhookUrl;
        body = { text: `TaskZen Event: ${payload.event}\nTask: ${payload.data.text}` };
    } else if (integration.type === 'jira') {
        // Jira logic would be more complex
        return; // Placeholder
    } else { // Generic webhook
        url = integration.webhookUrl;
        body = payload;
    }
    
    if (!url) return;

    const companyId = integrationId.split('/')[1]; // Assuming path is companies/{id}/integrations/{id}
    const logRef = db.collection(`companies/${companyId}/integrations/${integrationId}/deliveryLogs`).doc();

    try {
        const response = await axios.post(url, body, { timeout: 10000 });
        await logRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'success',
            request: body,
            response: {
                status: response.status,
                data: response.data,
            },
            payload: payload,
        });
    } catch (error: any) {
        await logRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            request: body,
            error: {
                message: error.message,
                code: error.code,
            },
            payload: payload,
        });
        // In production, you would add retry logic here, e.g., push to a Pub/Sub topic for retries.
    }
}

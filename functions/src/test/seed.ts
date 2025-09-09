
/**
 * @fileoverview A script to seed the Firestore emulator with initial data for testing.
 * To run: `npx ts-node src/test/seed.ts` from the `functions` directory.
 */

import * as admin from 'firebase-admin';

// Initialize the Admin SDK
// This assumes you're running the script in an environment where
// GOOGLE_APPLICATION_CREDENTIALS is set, or you're using the emulator.
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({ projectId: 'taskzen-test' });

const db = admin.firestore();

async function seed() {
    console.log('Starting to seed the database...');

    const companyId = 'test-company';
    const projectId = 'test-project';
    const companyRef = db.collection('companies').doc(companyId);
    const projectRef = db.collection('projects').doc(projectId);

    // Batch writes for efficiency
    const batch = db.batch();

    // 1. Create Company
    batch.set(companyRef, {
        name: 'TestCorp',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        seats: { count: 3, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        features: { timeTracking: true, dependencies: true }
    });

    console.log(`- Seeding company: ${companyId}`);

    // 2. Create Users
    const users = [
        { uid: 'admin-user-id', email: 'admin@testcorp.com', displayName: 'Admin User', role: 'admin', companyId },
        { uid: 'manager-user-id', email: 'manager@testcorp.com', displayName: 'Manager User', role: 'manager', companyId },
        { uid: 'member-user-id', email: 'member@testcorp.com', displayName: 'Member User', role: 'member', companyId },
    ];

    users.forEach(user => {
        const userRef = db.collection('users').doc(user.uid);
        batch.set(userRef, { ...user, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log(`- Seeding user: ${user.email} (${user.role})`);
    });

    // 3. Create Project
    batch.set(projectRef, {
        name: 'Project Phoenix',
        companyId,
        ownerId: 'admin-user-id',
        members: ['admin-user-id', 'manager-user-id', 'member-user-id'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
     console.log(`- Seeding project: ${projectId}`);

    // 4. Create Tasks
    const tasks = [
        { text: 'Design new landing page', completed: false, assignedTo: 'manager-user-id' },
        { text: 'Develop API endpoints for user profiles', completed: false, assignedTo: 'member-user-id', dependsOn: ['task-1'] },
        { text: 'Write documentation for the new API', completed: false },
        { text: 'Deploy staging environment', completed: true, completedAt: new Date() },
        { text: 'User testing session', completed: false, deletedAt: new Date(), deletedBy: 'admin-user-id' },
    ];
    
    tasks.forEach((task, i) => {
        const taskRef = db.collection('projects').doc(projectId).collection('tasks').doc(`task-${i+1}`);
        batch.set(taskRef, {
            ...task,
            projectId: projectId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
     console.log(`- Seeding ${tasks.length} tasks`);


    // 5. Create Integrations
    const integrationsRef = companyRef.collection('integrations');
    batch.set(integrationsRef.doc('slack-integration'), {
        type: 'slack',
        enabled: true,
        webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK_URL' // Placeholder
    });
    batch.set(integrationsRef.doc('jira-integration'), {
        type: 'jira',
        enabled: false,
        apiUrl: 'https://your-domain.atlassian.net',
        projectKey: 'TASK',
        token: 'YOUR_JIRA_API_TOKEN'
    });
    console.log('- Seeding integrations for Slack and Jira');


    // 6. Create Audit Logs
    const auditLogsRef = companyRef.collection('auditLogs');
    batch.set(auditLogsRef.doc(), {
        actorId: 'super-admin',
        action: 'user.role.update',
        target: { type: 'user', id: 'manager-user-id' },
        changes: { from: 'member', to: 'manager' },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    batch.set(auditLogsRef.doc(), {
        actorId: 'admin-user-id',
        action: 'task.create',
        target: { type: 'task', id: 'task-1' },
        context: { projectId },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('- Seeding sample audit logs');

    // Commit the batch
    await batch.commit();

    console.log('Database seeding completed successfully!');
}

seed().catch(error => {
    console.error('Error seeding database:', error);
});

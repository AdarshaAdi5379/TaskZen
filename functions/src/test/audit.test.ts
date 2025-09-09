
import 'jest';
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';
import { onUserRoleChange, onTaskDelete, recordAuditLog } from '../audit'; // Adjust path as needed

// Initialize the test environment
const projectId = 'taskzen-test';
const testEnv = test({ projectId });

// Mock Firestore
admin.initializeApp({ projectId });
const db = admin.firestore();

describe('Audit Log Functions', () => {

    let collectionSpy: jest.SpyInstance;

    beforeEach(() => {
        // Spy on the 'add' method of the collection
        collectionSpy = jest.spyOn(admin.firestore().collection('companies').doc('test-company').collection('auditLogs'), 'add');
    });

    afterEach(() => {
        collectionSpy.mockRestore();
        testEnv.cleanup();
    });

    it('onUserRoleChange should log an audit entry when a role is changed', async () => {
        const userId = 'testUser123';
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({ role: 'user', companyId: 'test-company' }, `users/${userId}`);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({ role: 'admin', companyId: 'test-company' }, `users/${userId}`);
        
        const wrapped = testEnv.wrap(onUserRoleChange);
        
        await wrapped({ before: beforeSnap, after: afterSnap }, { params: { userId } });

        expect(collectionSpy).toHaveBeenCalledWith(expect.objectContaining({
            action: 'user.role.update',
            target: { type: 'user', id: userId },
            changes: { from: 'user', to: 'admin' }
        }));
    });

    it('onTaskDelete should log an audit entry for soft-deletes', async () => {
        const projectId = 'test-project';
        const taskId = 'test-task';
        
        // Mock the project document lookup
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.set({ companyId: 'test-company' });

        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({ deletedAt: null }, `projects/${projectId}/tasks/${taskId}`);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({ deletedAt: new Date(), deletedBy: 'adminUser' }, `projects/${projectId}/tasks/${taskId}`);

        const wrapped = testEnv.wrap(onTaskDelete);

        await wrapped({ before: beforeSnap, after: afterSnap }, { params: { projectId, taskId } });

        expect(collectionSpy).toHaveBeenCalledWith(expect.objectContaining({
            action: 'task.delete.soft',
            target: { type: 'task', id: taskId },
            actorId: 'adminUser'
        }));
    });

    it('recordAuditLog helper should correctly write to firestore', async () => {
        await recordAuditLog('test-company', {
            actorId: 'system',
            action: 'test.action',
            target: { type: 'system', id: 'test' }
        });
        expect(collectionSpy).toHaveBeenCalledWith(expect.objectContaining({
            action: 'test.action'
        }));
    });
});

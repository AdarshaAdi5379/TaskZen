
import 'jest';
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';
import * as axios from 'axios';
import { webhookDispatcher } from '../integrations';

// Initialize the test environment
const projectId = 'taskzen-test';
const testEnv = test({ projectId });

// Mock Firestore
admin.initializeApp({ projectId });
const db = admin.firestore();

// Mock axios
jest.mock('axios');
const mockedAxios = axios.default as jest.Mocked<typeof axios>;

describe('Integration Functions', () => {

    let deliveryLogsSpy: jest.SpyInstance;

    beforeEach(async () => {
        // Setup mock data
        const companyRef = db.collection('companies').doc('test-company');
        await companyRef.collection('integrations').doc('slack-integration').set({
            type: 'slack',
            webhookUrl: 'https://hooks.slack.com/services/FAKE/URL',
            enabled: true
        });
        await db.collection('projects').doc('test-project').set({
            companyId: 'test-company'
        });

        deliveryLogsSpy = jest.spyOn(db.collection('companies').doc('test-company').collection('integrations').doc('slack-integration').collection('deliveryLogs'), 'doc');
    });

    afterEach(() => {
        deliveryLogsSpy.mockRestore();
        testEnv.cleanup();
        jest.clearAllMocks();
    });

    it('webhookDispatcher should send a request and log success', async () => {
        mockedAxios.post.mockResolvedValue({ status: 200, data: 'ok' });

        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({}, 'projects/test-project/tasks/test-task-1');
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({ text: 'A new task!' }, 'projects/test-project/tasks/test-task-1');
        
        const change = { before: beforeSnap, after: afterSnap };
        const context = { params: { projectId: 'test-project', taskId: 'test-task-1' }};

        const wrapped = testEnv.wrap(webhookDispatcher);
        await wrapped(change, context);

        // Verify axios was called
        expect(mockedAxios.post).toHaveBeenCalledWith('https://hooks.slack.com/services/FAKE/URL', {
            text: "TaskZen Event: task.created\nTask: A new task!"
        }, { timeout: 10000 });

        // Verify a success log was created
        expect(deliveryLogsSpy).toHaveBeenCalled();
        // A more robust test would check the *content* of the log written, but that requires more complex mocking.
    });

     it('webhookDispatcher should log a failure if the request fails', async () => {
        mockedAxios.post.mockRejectedValue(new Error('Network Error'));

        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({}, 'projects/test-project/tasks/test-task-2');
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({ text: 'Another task!' }, 'projects/test-project/tasks/test-task-2');
        
        const change = { before: beforeSnap, after: afterSnap };
        const context = { params: { projectId: 'test-project', taskId: 'test-task-2' }};

        const wrapped = testEnv.wrap(webhookDispatcher);
        await wrapped(change, context);

        expect(mockedAxios.post).toHaveBeenCalled();
        expect(deliveryLogsSpy).toHaveBeenCalled();
    });
});


# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Production Features Setup

This project now includes a backend powered by Cloud Functions for Firebase.

### Running with Firebase Emulators

To test the new backend features locally, you need to use the Firebase Emulator Suite.

1.  **Install Firebase CLI**: If you haven't already, install the Firebase CLI:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**:
    ```bash
    firebase login
    ```

3.  **Initialize Emulators**:
    From the root of your project directory, run:
    ```bash
    firebase init emulators
    ```
    When prompted, select the **Functions**, **Firestore**, and **Auth** emulators. Use the default ports.

4.  **Start Emulators**:
    ```bash
    firebase emulators:start
    ```
    This will start the local emulators. Keep this terminal window running. Your functions will be available locally, and your app (when configured) will connect to the local Firestore and Auth emulators instead of your live Firebase project.

### Testing Webhooks

The webhook dispatcher function can be tested locally.

1.  **Start Emulators** (if not already running).
2.  **Get the Webhook URL**: The emulator will log the local URL for your `webhookDispatcher` function. It will look something like `http://localhost:5001/YOUR_PROJECT_ID/us-central1/webhookDispatcher`.
3.  **Use a Tool like `curl` or Postman**: Send a POST request to this URL to simulate a webhook event from an external service.

    Example with `curl`:
    ```bash
    curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/webhookDispatcher \
    -H "Content-Type: application/json" \
    -d '{
      "event": "task:created",
      "payload": { "taskId": "someTaskId", "text": "New task from webhook!" }
    }'
    ```
4.  **Check Logs**: Look at the "functions" emulator logs in your terminal to see the output from the `webhookDispatcher` function and check the Firestore emulator UI to see the `deliveryLogs`.

### Seeding Data

To test integrations, you can add sample data to your local Firestore emulator.

1. **Navigate to the Firestore Emulator UI**: While the emulators are running, open `http://localhost:4000` in your browser.
2. **Create Data**: Manually create the following documents:
   - **Collection**: `companies` -> **Document**: `test-company`
   - **Collection**: `integrations` (subcollection of `test-company`) -> **Document**: `slack-integration`
     - **Fields**:
       - `type`: "slack"
       - `webhookUrl`: "YOUR_SLACK_INCOMING_WEBHOOK_URL"
       - `enabled`: `true`
   - **Collection**: `integrations` (subcollection of `test-company`) -> **Document**: `jira-integration`
     - **Fields**:
       - `type`: "jira"
       - `apiUrl`: "https://your-domain.atlassian.net"
       - `projectKey`: "TASK"
       - `token`: "YOUR_JIRA_API_TOKEN" (use a secret manager in production)
       - `enabled`: `true`

Now, when you trigger functions that use integrations (like creating a task), they will use this configuration data.

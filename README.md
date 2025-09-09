
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

## Testing Guide

### Seeding Data

To test integrations and features that require existing data, you can run the seed script. This script will populate your local Firestore emulator with a test company, users, tasks, and integration configurations.

1. **Start Emulators**: Make sure the emulators are running as described above.
2. **Run the Seed Script**: In a new terminal window, navigate to the `functions` directory and run:
   ```bash
   cd functions
   npm install
   npm run build
   npx ts-node src/test/seed.ts
   ```
3. **Verify Data**: Open the Firestore emulator UI (usually at `http://localhost:4000`) to see the newly created data in the `companies`, `users`, `projects`, and `integrations` collections.

### Testing Webhooks

The webhook dispatcher function can be tested locally to simulate events and verify that they are sent to configured endpoints.

1.  **Start Emulators** and **Seed Data** (if not already done). The seed script creates a Slack integration with a placeholder URL.
2.  **Get the Webhook URL**: The emulator will log the local URL for your `webhookDispatcher` function. It will look something like `http://localhost:5001/YOUR_PROJECT_ID/us-central1/webhookDispatcher`.
3.  **Use `curl` or Postman**: Send a POST request to this URL to simulate a `task.created` event.

    Example with `curl` (replace `YOUR_PROJECT_ID` with your actual Firebase project ID):
    ```bash
    curl -X POST http://localhost:5001/taskzen-4o5su/us-central1/webhookDispatcher \
    -H "Content-Type: application/json" \
    -d '{
      "event": {
        "params": { "projectId": "test-project", "taskId": "test-task-webhook" }
      },
      "data": {
        "before": {},
        "after": { "text": "New task from webhook!", "completed": false }
      }
    }'
    ```
4.  **Check Logs**:
    - Look at the "functions" emulator logs in your terminal to see the output from the `webhookDispatcher` function.
    - Check the Firestore emulator UI to see the `deliveryLogs` collection under `companies/test-company/integrations/slack-integration`.

### Running Jest Tests

The project includes a Jest test suite to validate function logic, such as audit logging.

1. **Start Emulators**: Ensure the emulators are running.
2. **Run Tests**: In a new terminal, navigate to the `functions` directory and run:
   ```bash
   cd functions
   npm test
   ```
   This will run the tests in watch mode, re-running them whenever you make a change.


/**
 * @fileoverview Main entry point for all Cloud Functions.
 * This file imports and re-exports all other function modules.
 */

import * as admin from 'firebase-admin';
import * as Sentry from "@sentry/node";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Sentry for error tracking
// IMPORTANT: Replace with your actual Sentry DSN in a secure way (e.g., environment variables)
Sentry.init({ dsn: process.env.SENTRY_DSN });

// Export all functions from their respective modules
export * from './audit';
export * from './billing';
export * from './collaboration';
export * from './integrations';
export * from './search';
export * from './data';
export * from './ux';
export * from './admin';
export * from './scheduled';

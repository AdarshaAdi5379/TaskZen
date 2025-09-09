
/**
 * @fileoverview Cloud Functions for billing, seat management, and invoice handling.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { logBillingAction } from './audit';

// Initialize Stripe with your secret key
// IMPORTANT: Use environment variables for secrets
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

const db = admin.firestore();

// Callable function to update the number of seats for a company
export const updateSeats = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { companyId, newSeatCount } = data;
    if (!companyId || typeof newSeatCount !== 'number' || newSeatCount < 1) {
        throw new functions.https.HttpsError('invalid-argument', 'Please provide a valid companyId and newSeatCount.');
    }
    
    // You would add logic here to check if the user is an admin of the company
    
    const companyRef = db.collection('companies').doc(companyId);
    
    // In a real app, this would update the subscription on Stripe
    // For example: stripe.subscriptions.update(...)
    
    await companyRef.update({ 'seats.count': newSeatCount, 'seats.updatedAt': admin.firestore.FieldValue.serverTimestamp() });

    await logBillingAction(companyId, uid, 'seats.update', { newSeatCount });

    return { success: true, newSeatCount };
});

// Webhook handler for incoming invoices from Stripe or Razorpay
export const handleInvoiceWebhook = functions.https.onRequest(async (req, res) => {
    // This is a simplified example. In production, you would verify the webhook signature.
    // e.g., const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    
    const event = req.body; // Assuming the event payload is in the request body

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const companyId = invoice.customer_metadata?.companyId;

        if (companyId) {
            await db.collection('companies').doc(companyId).collection('billing/invoices').add(invoice);
            console.log(`Invoice ${invoice.id} saved for company ${companyId}`);
        }
    }
    
    res.status(200).send({ received: true });
});

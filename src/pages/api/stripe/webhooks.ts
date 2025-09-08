import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // On error, log and return the error message.
      console.log(`❌ Error message: ${errorMessage}`);
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    // Successfully constructed event.
    console.log('✅ Success:', event.id);

    // Cast event data to Stripe object.
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { client_reference_id: userId, subscription } = session;
        
        if(!userId || !subscription) {
             return res.status(400).send('Webhook Error: Missing userId or subscription');
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            subscriptionId: subscription,
            subscriptionStatus: 'active',
        });

    } else if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const { status, current_period_end } = subscription;
        const userId = subscription.metadata.userId;

        if(!userId) {
            return res.status(400).send('Webhook Error: Missing userId in subscription metadata');
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            subscriptionStatus: status,
            subscriptionEndsAt: new Date(current_period_end * 1000),
        });
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        if(!userId) {
            return res.status(400).send('Webhook Error: Missing userId in subscription metadata');
        }
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            subscriptionStatus: 'canceled',
        });
    } else {
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};

export default handler;

import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const planId = process.env.RAZORPAY_PLAN_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!planId) {
        return res.status(500).json({ message: 'Razorpay Plan ID is not configured.' });
    }

    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ message: 'User not found.' });
      }
      
      const userData = userSnap.data();

      // Create a subscription on Razorpay
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12, // For a yearly plan, charge for 12 cycles
        notes: {
          userId: userId,
        },
      });

      // Update user document with subscription details
      await updateDoc(userRef, {
        razorpayPlanId: planId,
        razorpaySubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });

      res.status(200).json({ subscriptionId: subscription.id });
    } catch (err) {
      console.error('Razorpay subscription creation error:', err);
      const error = err as Error;
      res.status(500).json({ message: error.message || 'Failed to create subscription.' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

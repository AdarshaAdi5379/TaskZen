import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      userId,
    } = req.body;

    if (!userId || !razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment details.' });
    }
    
    try {
        const generated_signature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
          .digest('hex');

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ message: 'Invalid transaction signature.' });
        }

        // Signature is valid, update user's subscription status in Firestore
        const db = getFirebaseDb();
        const userRef = doc(db, 'users', userId);
        
        await updateDoc(userRef, {
            subscriptionStatus: 'active', // Or fetch from Razorpay for confirmation
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

      res.status(200).json({ message: 'Payment verified successfully.' });
    } catch (err) {
      console.error('Razorpay payment verification error:', err);
      const error = err as Error;
      res.status(500).json({ message: error.message || 'Failed to verify payment.' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

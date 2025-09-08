import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, userId } = req.body;

    if (!email || !userId) {
        return res.status(400).json({ error: 'Email and UserId are required.' });
    }
    
    try {
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
        customer_email: email,
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            userId: userId,
          }
        }
      });

      res.status(200).json({ sessionId: session.id });
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

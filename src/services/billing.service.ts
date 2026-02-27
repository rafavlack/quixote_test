import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

function getStripe(): Stripe | null {
    const key = process.env.STRIPE_API_KEY;
    if (!key) return null;
    return new Stripe(key);
}

export class BillingService {

    /**
     * Ensures a Stripe customer exists for a given user.
     * If the profile has no stripe_customer_id, creates one in Stripe and returns it.
     * Returns null if Stripe is not configured.
     */
    static async ensureCustomerExists(userEmail: string, userId: string): Promise<string | null> {
        const stripe = getStripe();
        if (!stripe) {
            console.log('Skipping Stripe customer provisioning - No STRIPE_API_KEY');
            return null;
        }
        try {
            // Check if the customer already exists in Stripe by metadata
            const existing = await stripe.customers.search({
                query: `metadata['userId']:'${userId}'`,
                limit: 1
            });
            if (existing.data.length > 0) {
                return existing.data[0].id;
            }
            // Create a new customer
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: { userId }
            });
            console.log(`Created Stripe customer ${customer.id} for user ${userId}`);
            return customer.id;
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error ensuring Stripe customer exists:', error.message);
            }
            return null;
        }
    }

    static async reportUsage(stripeCustomerId: string, tokensCount: number) {
        const stripe = getStripe();
        try {
            if (!stripe) {
                console.log('Skipping Stripe billing report - No STRIPE_API_KEY');
                return { success: false, reason: 'No STRIPE_API_KEY' };
            }

            console.log(`Reporting ${tokensCount} tokens for customer ${stripeCustomerId} to Stripe...`);

            // Find the active subscription for the customer
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length === 0) {
                console.log(`No active subscription found for customer ${stripeCustomerId}. Skipping usage record.`);
                return { success: false, reason: 'No active subscription' };
            }

            const subscription = subscriptions.data[0];
            // Assuming the first item is the metered token price
            const subscriptionItemId = subscription.items.data[0].id;

            await stripe.subscriptionItems.createUsageRecord(
                subscriptionItemId,
                {
                    quantity: tokensCount,
                    timestamp: Math.floor(Date.now() / 1000),
                    action: 'increment',
                }
            );

            return { success: true, reportedAt: new Date() };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error reporting usage to Stripe:', error.message);
            }
        }
    }

    static async getUpcomingInvoice(stripeCustomerId: string) {
        const stripe = getStripe();
        if (!stripe) return null;
        try {
            const invoice = await stripe.invoices.retrieveUpcoming({
                customer: stripeCustomerId
            });
            return {
                estimatedCost: invoice.amount_due / 100, // Amount is in cents
                currency: invoice.currency.toUpperCase()
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error fetching upcoming invoice:', error.message);
            }
            return null;
        }
    }
}



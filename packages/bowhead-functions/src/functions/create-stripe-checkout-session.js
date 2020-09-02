import { stripe } from '../utils/stripeBackend'
import { verifyToken } from '../utils/firebaseBackend';

export const createStripeCheckoutSession = async ({ token, body }) => {
    const user = await verifyToken(token);
    if (!user) return { error: 'Error: request unauthorised', dat: { statusCode: 401 } }

    const data = JSON.parse(body);

    // do not provide a free trial if the user has previously signed up
    data?.customer && delete data?.subscription_data;

    return await stripe.checkout.sessions.create(data).then((session) => session)
}
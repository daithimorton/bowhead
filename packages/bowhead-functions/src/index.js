import { firebase } from './utils/firebase';
import Stripe from 'stripe'
import { dbUpdateSubscriptionByCustomerId, dbUpdateCustomerData } from './utils/webhook-stripe-utils'

class BowheadFunctions {

    constructor(config) {
        // singleton
        if (BowheadFunctions._instance) {
            return BowheadFunctions._instance;
        }
        BowheadFunctions._instance = this;

        this._firebase = firebase(config.firebase)
        this._firestore = this._firebase.firestore
        this._stripeWebhookSigningSecret = config.stripe.stripeWebhookSigningSecret
        this._stripe = Stripe(config.stripe.stripeSecretKey, {
            maxNetworkRetries: 3, // Retry a request X times before giving up
        });
    }

    _requestUnauthourised() {
        return { error: 'Error: request unauthorised', data: { statusCode: 401 } }
    }

    async webhookStripe({ stripeSignature, rawBody }) {

        let verifiedEvent;
        try {
            verifiedEvent = this._stripe.webhooks.constructEvent(rawBody, stripeSignature, this._stripeWebhookSigningSecret);
        } catch (error) {
            // invalid event            
            return Promise.reject(error.message)
        }

        switch (verifiedEvent.type) {
            case 'customer.subscription.created':
                await dbUpdateSubscriptionByCustomerId(this._firestore, verifiedEvent.data.object)
                break;
            case 'customer.subscription.updated':
                await dbUpdateSubscriptionByCustomerId(this._firestore, verifiedEvent.data.object)
                break;
            case 'customer.subscription.deleted':
                await dbUpdateSubscriptionByCustomerId(this._firestore, verifiedEvent.data.object)
                break;
            case 'checkout.session.completed':
                await dbUpdateCustomerData(this._firestore, verifiedEvent.data.object)
                break;
            default:
                // unexpected event type
                return Promise.resolve('unexpected event type');
        }

        return Promise.resolve('webhook done');
    }

    async deleteStripeCustomer({ token, data }) {
        const user = await this._firebase.verifyToken(token);
        const stripeCustomerId = data?.stripeCustomerId;
        // todo validate data
        if (!user) return this._requestUnauthourised()
        return await this._stripe.customers.del(stripeCustomerId);
    }

    async createStripeCustomerPortalSession({ token, data }) {
        const user = await this._firebase.verifyToken(token);
        // todo validate data
        if (!user) return this._requestUnauthourised()
        return await this._stripe.billingPortal.sessions.create(data).then((session) => session);
    }

    async createStripeCheckoutSession({ token, data }) {
        const user = await this._firebase.verifyToken(token);
        // todo validate data
        if (!user) return this._requestUnauthourised()

        // do not provide a free trial if the user has previously signed up
        data?.customer && delete data?.subscription_data;

        return await this._stripe.checkout.sessions.create(data).then((session) => session)
    }

}

export default BowheadFunctions
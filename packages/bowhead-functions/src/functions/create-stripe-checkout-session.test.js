import { createStripeCheckoutSession } from './create-stripe-checkout-session';
import { stripe } from '../utils/stripeBackend'
import { verifyToken } from '../utils/firebaseBackend';

jest.mock('../utils/firebaseBackend')
jest.mock('../utils/stripeBackend')
jest.mock('firebase-admin', () => ({
    firestore: jest.fn()
}));

test('should return 401 when token unauthorized', async () => {
    // given    
    JSON.parse = jest.fn().mockImplementationOnce((eventBody) => eventBody);
    verifyToken.mockImplementationOnce(() => false)

    stripe.checkout.sessions.create.mockResolvedValue({});

    // when
    const result = await createStripeCheckoutSession({ token: 'test', body: {} });

    // then
    expect(result.data.statusCode).toBe(401);
});

test('should return 200 ok when stripe checkout session creation succeeds', async () => {
    // given        
    verifyToken.mockImplementationOnce(() => true)

    JSON.parse = jest.fn().mockImplementationOnce((eventBody) => eventBody);

    stripe.checkout.sessions.create.mockResolvedValue({ data: { statusCode: 200 } });

    // when
    const result = await createStripeCheckoutSession({ token: 'test', body: {} });

    // then
    expect(result.data.statusCode).toBe(200);
});

test('should return error when stripe checkout session creation fails', async () => {
    // given        
    verifyToken.mockImplementationOnce(() => true)

    const error = {
        error: 'error'
    }

    JSON.parse = jest.fn().mockImplementationOnce((eventBody) => eventBody);

    // create stripe session failed
    stripe.checkout.sessions.create.mockRejectedValue(error);

    // when
    const result = await createStripeCheckoutSession({ token: 'test', body: {} }).catch(error => error);

    // then
    expect(result).toBe(error);
});

test('should remove subscription_data before call to stripe API when customer data exists', async () => {
    // given        
    verifyToken.mockImplementationOnce(() => true)

    JSON.parse = jest.fn().mockImplementationOnce((eventBody) => eventBody);

    stripe.checkout.sessions.create.mockResolvedValue({});

    // when
    await createStripeCheckoutSession({
        token: 'test', body: {
            customer: 'test',
            'subscription_data': 'test'
        }
    });

    // then    
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({ customer: 'test' })
});

test('should send subscription_data to stripe API when customer data does not exist', async () => {
    // given        
    verifyToken.mockImplementationOnce(() => true)

    JSON.parse = jest.fn().mockImplementationOnce((eventBody) => eventBody);

    stripe.checkout.sessions.create.mockResolvedValue({});

    // when
    await createStripeCheckoutSession({
        token: 'test', body: {
            // no customer data
            'subscription_data': 'test'
        }
    });

    // then    
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({ 'subscription_data': 'test' })
});




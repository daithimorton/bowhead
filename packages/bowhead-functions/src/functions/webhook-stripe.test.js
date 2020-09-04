import testFunction from './webhook-stripe';
import { stripe } from '../utils/stripeBackend'

jest.mock('../utils/firebaseBackend')
jest.mock('../utils/stripeBackend')
jest.mock('firebase-admin', () => ({
    firestore: jest.fn()
}));

test('should return 401 when stripe.webhooks.constructEvent fails', async () => {
    // given
    stripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw Error('fail')
    })

    let result = null;
    const callback = (error, response) => {
        result = { error, response }
    }

    const event = { headers: { 'stripe-signature': 'test' } }

    // when
    await testFunction(event, null, callback);

    // then
    expect(result.response.statusCode).toBe(400);
});



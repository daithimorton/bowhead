import { getToken } from '../../../utils/frontend/firebaseFrontend'

export const deleteStripeCustomerAndSubscription = async (customer) => {
    const token = await getToken();
    return fetch(`/.netlify/functions/delete-stripe-customer?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({ customer })
    })
}
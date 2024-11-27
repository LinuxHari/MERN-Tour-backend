import Stripe from "stripe"

type StripeData = {
    amount: number
    currency: "USD" | "INR"
    bookingId: string
    userId: string
}

const stripe =  new Stripe(process.env.STRIPE_SECRET as string)

export const stripeCreate = async ({amount, currency, bookingId, userId}: StripeData) => {
    const {id, client_secret, amount: chargeAmount} = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
            bookingId,
            userId
        }
    })

    return {paymentId: id, clientSecret: client_secret, amount: chargeAmount}
}
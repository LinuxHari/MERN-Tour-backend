import Stripe from "stripe"

type StripeData = {
    amount: number
    currency: "USD" | "INR"
    bookingId: string
    userId: string
}

const stripe =  new Stripe(process.env.STRIPE_SECRET as string)

export const stripeCreate = async ({amount, currency, bookingId, userId}: StripeData) => {
    const chargeDetails = await stripe.charges.create({
        amount,
        currency,
        metadata: {
            bookingId,
            userId
        }
    })
}
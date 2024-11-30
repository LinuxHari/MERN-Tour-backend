import Stripe from "stripe"

type StripeCreateParam = {
    amount: number
    currency: "USD" | "INR"
    bookingId: string
    userId: string
}

type StripeValidateParam = {
    data: any
    signature: string
}

const stripe =  new Stripe(process.env.STRIPE_SECRET as string)

export const stripeCreate = async ({amount, currency, bookingId, userId}: StripeCreateParam) => {
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

export const stripeValidate = ({data, signature}: StripeValidateParam) => Stripe.webhooks.constructEvent(data, signature, process.env.STRIPE_WEBHOOK_SECRET as string)

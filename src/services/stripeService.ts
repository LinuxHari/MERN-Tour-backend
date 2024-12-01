import Stripe from "stripe"
import responseHandler from "../handlers/responseHandler"
import { BadRequestError } from "../handlers/errorHandler"

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

type StripeWebhookActionParam = {
    userId: string,
    bookingId: string
}

type StripeWebhookSuccessparam = StripeWebhookActionParam & {
    amountCharged: number
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

export const stripeValidate = ({data, signature}: StripeValidateParam) => {
    try{
        return Stripe.webhooks.constructEvent(data, signature, process.env.STRIPE_WEBHOOK_SECRET as string)
    } catch(err){
        throw new BadRequestError("Invalid signature")
    }
}

export const stripeAuthorized = ({userId, bookingId}: StripeWebhookActionParam) => {

}

export const stripeSuccess = ({amountCharged, userId, bookingId}: StripeWebhookSuccessparam) => {

}

export const stripeFailed = ({ userId, bookingId}: StripeWebhookActionParam) => {

}
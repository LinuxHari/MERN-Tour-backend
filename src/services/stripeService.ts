import Stripe from "stripe"
import { BadRequestError, NotFoundError } from "../handlers/errorHandler"
import Booking from "../models/bookingModel"

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

type StripeWebhookSuccessparam = {
    amountCharged: number;
    userId: string;
    bookingId: string
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

export const stripeAuthorized = async (bookingId: string) => {
    const existingBooking = await Booking.findById(bookingId)
    if(!existingBooking)
        throw new NotFoundError(`Existing Booking with ${bookingId} is not found for stripe authorization`)
    existingBooking.bookingStatus = "Init"
    await existingBooking.save()
}

export const stripeSuccess = async ({amountCharged, userId, bookingId}: StripeWebhookSuccessparam) => {
    const existingBooking = await Booking.findById(bookingId)
    if(!existingBooking)
        throw new NotFoundError(`Existing Booking with ${bookingId} is not found for stripe authorization`)
    if(amountCharged !== existingBooking.transaction.amount){

    }
    existingBooking.bookingStatus = "Success"
    existingBooking.transaction.paymentStatus = "paid"
    await existingBooking.save()
}

export const stripeFailed = async ( bookingId: string) => {
    const existingBooking = await Booking.findById(bookingId)
    if(!existingBooking)
        throw new NotFoundError(`Existing Booking with ${bookingId} is not found for stripe failure`)
    existingBooking.bookingStatus = "Failed"
    await existingBooking.save()
}
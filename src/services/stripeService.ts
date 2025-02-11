import Stripe from "stripe";
import { BadRequestError, NotFoundError, ServerError } from "../handlers/errorHandler";
import Booking, { PaymentType } from "../models/bookingModel";
import envConfig from "../config/envConfig";
import Reserved from "../models/reserveModel";
import calcPercentage from "../utils/calcPercentage";
import { NON_FREE_REFUND_CHARGE } from "../config/tourConfig";
import Tour from "../models/tourModel";
import { sendBookingMail } from "./emailService";

type StripeCreateParam = {
  amount: number;
  currency: "USD" | "INR";
  bookingId: string;
  userId: string;
};

type StripeValidateParam = {
  data: any;
  signature: string;
};

type StripeWebhookSuccessparam = {
  amountCharged: number;
  userId: string;
  bookingId: string;
  data: Stripe.PaymentIntent;
};

const stripe = new Stripe(envConfig.stripeSecret as string);

export const stripeCreate = async ({ amount, currency, bookingId, userId }: StripeCreateParam) => {
  const { id, client_secret } = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      bookingId,
      userId
    }
  });

  return { paymentId: id, clientSecret: client_secret };
};

export const stripeValidate = ({ data, signature }: StripeValidateParam) => {
  try {
    return Stripe.webhooks.constructEvent(data, signature, envConfig.stripeWebhookSecret as string);
  } catch (err) {
    console.log(err);
    throw new BadRequestError("Invalid signature");
  }
};

const stripeChargeDetails = async (latestChargeId: string) =>
  await stripe.charges.retrieve(latestChargeId);

const updatePayment = async (payment: PaymentType, latestChargeId: string) => {
  const chargeDetails = await stripeChargeDetails(latestChargeId);
  payment.reciept = chargeDetails.receipt_url;
  const card = chargeDetails.payment_method_details?.card;
  payment.card = {
    number: card?.last4,
    brand: card?.brand,
    expMonth: card?.exp_month,
    expYear: card?.exp_year
  };
};

export const stripeAuthorized = async (bookingId: string) => {
  const existingBooking = await Booking.findById(bookingId);
  if (!existingBooking)
    throw new NotFoundError(
      `Existing Booking with ${bookingId} is not found for stripe authorization`
    );
  existingBooking.bookingStatus = "init";
  await existingBooking.save();
};

export const stripeFailed = async (bookingId: string, data: Stripe.PaymentIntent) => {
  const existingBooking = await Booking.findById(bookingId);
  if (!existingBooking)
    throw new NotFoundError(`Existing Booking with ${bookingId} is not found for stripe failure`);
  existingBooking.transaction.paymentStatus = "unpaid";
  const payment =
    existingBooking.transaction.history[existingBooking.transaction.history.length - 1];

  await updatePayment(payment, data.latest_charge as string);
  existingBooking.bookingStatus = "failed";
  await existingBooking.save();
};

export const stripeSuccess = async ({
  amountCharged,
  userId,
  bookingId,
  data
}: StripeWebhookSuccessparam) => {
  const existingBooking = await Booking.findById(bookingId);
  if (!existingBooking || userId !== String(existingBooking.userId))
    throw new NotFoundError(`Existing Booking with ${bookingId} is not found for stripe success`);
  const reservation = await Reserved.findById(existingBooking.reserveId, { expiresAt: 1 });
  if (!reservation)
    throw new ServerError(
      `Reservation for ${existingBooking.bookingId} is not found in stripe success`
    );
  const payment =
    existingBooking.transaction.history[existingBooking.transaction.history.length - 1];

  if (amountCharged !== payment.amount) {
    await stripeFailed(bookingId, data);
    throw new BadRequestError(`Amount mismatch for booking ${bookingId}`);
  }

  const tour = await Tour.findOne(
    { tourId: existingBooking.tourId },
    { freeCancellation: 1, name: 1 }
  ).lean();
  if (!tour)
    throw new ServerError(`Tour for ${existingBooking.tourId} is not found in stripe success`);

  payment.refundableAmount = tour.freeCancellation
    ? payment.amount
    : calcPercentage(payment.amount, NON_FREE_REFUND_CHARGE);
  payment.status = "success";

  existingBooking.bookingStatus = "success";
  existingBooking.transaction.paymentStatus = "paid";

  reservation.expiresAt = new Date().getTime();

  await updatePayment(payment, data.latest_charge as string); // Latest charge is null until PaymentIntent confirmation is attempted.
  await reservation.save();
  await payment.save();
  const { error } = await sendBookingMail({ ...existingBooking.toObject(), tourName: tour.name });
  existingBooking.emailStatus = error ? "failed" : "sent";
  await existingBooking.save();
};

export const stripeRefund = async (paymentIntent: string, amount: number) => {
  await stripe.refunds.create({
    payment_intent: paymentIntent,
    amount
  });
};

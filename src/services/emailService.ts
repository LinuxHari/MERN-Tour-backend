import nodeMailer from "nodemailer";
import envConfig from "../config/envConfig";
import bookingTemplate from "../templates/bookingTemplate";
import { BookingType } from "../models/bookingModel";
import verificationTemplate from "../templates/verificationTemplate";
import resetPasswordTemplate from "../templates/resetPassTemplate";
import { ServerError } from "../handlers/errorHandler";

export type EmailBooking = BookingType & { tourName: string; destination: string };

const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: envConfig.emailUser,
    pass: envConfig.emailPass
  }
});

export const sendBookingMail = async (booking: EmailBooking) => {
  try {
    await transporter
      .sendMail({
        from: envConfig.emailUser,
        to: booking.bookerInfo.email,
        subject: `Booking ${booking.bookingStatus === "success" ? "Confirmation" : "Cancelation"}`,
        html: bookingTemplate(booking)
      })
      .catch((err) => {
        throw err;
      });
    return { error: false };
  } catch (err) {
    return { error: true };
  }
};

export const sendVerificationMail = async (email: string, token: string, name: string) => {
  try {
    await transporter
      .sendMail({
        from: envConfig.emailUser,
        to: email,
        subject: "Email Verification",
        html: verificationTemplate(token, name)
      })
      .catch((err) => {
        throw err;
      });
    return { error: false };
  } catch (_) {
    return { error: true };
  }
};

export const sendResetPassMail = async (email: string, token: string, name: string) => {
  await transporter
    .sendMail({
      from: envConfig.emailUser,
      to: email,
      subject: "Email Verification",
      html: resetPasswordTemplate(token, name)
    })
    .catch((err) => {
      throw new ServerError(err);
    });
};

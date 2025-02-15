import nodeMailer from "nodemailer";
import envConfig from "../config/envConfig";
import bookingTemplate from "../templates/bookingTemplate";
import { BookingType } from "../models/bookingModel";

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
    await transporter.sendMail({
      from: envConfig.emailUser,
      to: booking.bookerInfo.email,
      subject: `Booking ${booking.bookingStatus === "success" ? "Confirmation" : "Cancelation"}`,
      html: bookingTemplate(booking)
    });
    return { error: false };
  } catch (err) {
    return { error: true };
  }
};

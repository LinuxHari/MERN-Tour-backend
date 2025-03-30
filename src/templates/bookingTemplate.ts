import envConfig from "../config/envConfig";
import { EmailBooking } from "../services/emailService";
import getDuration from "../utils/getDuration";

const bookingTemplate = (booking: EmailBooking) => {
  const isSuccess = booking.bookingStatus === "success";
  const payment = booking.transaction.history[booking.transaction.history.length - 1];
  const isFreeCancelation = isSuccess && payment.refundableAmount !== payment.amount;
  const transformedDestination = booking.destination.split("-").join("_").split(" ").join("-");
  const transformedTourName = booking.tourName.split("-").join("_").split(" ").join("-");

  return `<!DOCTYPE html> 
<html> 
<head> 
    <meta charset="UTF-8"> 
    <title>Booking ${isSuccess ? "Confirmation" : "Cancellation"}</title> 
</head> 
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"> 
    <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; width: 100%;"> 
        <tr> 
            <td> 
                <div style="text-align: center; margin-bottom: 20px;">
                    <table align="center">
                        <tr>
                            <td>
                               <img src="https://firebasestorage.googleapis.com/v0/b/mern-tours-e23a8.appspot.com/o/assets%2Fsuccess.png?alt=media&token=6952e61b-0fbb-4539-94fa-2b2ba40f9e37" alt="mern-tours" style="height:60px;width:60px;"/>
                            </td>
                        </tr>
                    </table>
                </div>

                ${
                  isFreeCancelation
                    ? `<div style="text-align: center; margin-bottom: 20px;"> 
                    <span style="background-color: #2E8B57; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px;">Free cancellation</span> 
                </div>`
                    : ""
                } 

                <div style="text-align: center; margin-bottom: 30px;"> 
                    <h1 style="color: #1A1B3D; font-size: 24px; margin-bottom: 10px;">${booking.bookerInfo.name}, your tour is ${isSuccess ? "confirmed successfully!" : "canceled!"}</h1> 
                </div> 

                <div style="border: 1px dashed #F26B3C; border-radius: 8px; padding: 20px; margin-bottom: 30px;"> 
                    <table style="width: 100%;"> 
                        <tr> 
                            <td style="color: #666;">Order Number</td> 
                            <td style="color: #666;">Date</td> 
                            <td style="color: #666;">Total</td> 
                            <td style="color: #666;">Payment Method</td> 
                        </tr> 
                        <tr> 
                            <td style="color: #5B4DFF;">${booking.bookingId}</td> 
                            <td>${booking.createdAt.toISOString().split("T")[0]}</td> 
                            <td>$${payment.amount.toFixed(2)}</td> 
                            <td>Card</td> 
                        </tr> 
                    </table> 
                </div> 

                <div style="margin-bottom: 30px;"> 
                    <h2 style="color: #1A1B3D; font-size: 20px; margin-bottom: 20px;">Tour Details</h2> 
                    <table style="width: 100%;"> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Name</td> 
                            <td style="text-align: right;">${booking.tourName}</td> 
                        </tr> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Duration:</td> 
                            <td style="text-align: right;">${getDuration(booking.startDate, booking.endDate)}</td> 
                        </tr> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Tickets:</td> 
                            <td style="text-align: right;">
                                ${booking.passengers.adults} x Adult
                                ${booking.passengers?.teens ? `, ${booking.passengers.teens} x Teen` : ""}
                                ${booking.passengers?.children ? `, ${booking.passengers.children} x Child` : ""}
                                ${booking.passengers?.infants ? `, ${booking.passengers.infants} x Infant` : ""}
                            </td> 
                        </tr> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Start Date</td> 
                            <td style="text-align: right;">${booking.startDate}</td> 
                        </tr> 
                    </table> 
                </div> 

                <div style="margin-bottom: 30px;"> 
                    <h2 style="color: #1A1B3D; font-size: 20px; margin-bottom: 20px;">Payment Details</h2> 
                    <table style="width: 100%;"> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Card:</td> 
                            <td style="text-align: right;">${payment.card?.number || "Not available"}</td> 
                        </tr> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Brand:</td> 
                            <td style="text-align: right;">${payment.card?.brand || "Not available"}</td> 
                        </tr> 
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Payment date:</td> 
                            <td style="text-align: right;">${booking.createdAt.toString()}</td> 
                        </tr>
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Paid:</td> 
                            <td style="text-align: right;">$${payment.amount.toFixed(2)}</td> 
                        </tr>
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Refundable:</td> 
                            <td style="text-align: right;">$${payment.refundableAmount.toFixed(2)}</td> 
                        </tr>
                        <tr> 
                            <td style="padding: 8px 0; color: #666;">Receipt:</td> 
                            <td style="text-align: right;">
                                <a href="${payment.reciept}" style="color: #5B4DFF; text-decoration: none;">View</a>
                            </td> 
                        </tr> 
                    </table> 
                </div> 

                <div style="text-align: right;"> 
                    <a href="${envConfig.frontend}/booking/${booking.bookingId}" style="display: inline-block; padding: 10px 20px; border: 1px solid #F26B3C; color: #F26B3C; text-decoration: none; border-radius: 4px; margin-right: 10px;">View details</a> 
                    <a href="${envConfig.frontend}/tours/${transformedDestination}/${transformedTourName}/${booking.tourId}" style="display: inline-block; padding: 10px 20px; background-color: #F26B3C; color: white; text-decoration: none; border-radius: 4px;">Book again</a> 
                </div> 
            </td> 
        </tr> 
    </table> 
</body> 
</html>`;
};

export default bookingTemplate;

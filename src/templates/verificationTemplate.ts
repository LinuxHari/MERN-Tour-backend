import envConfig from "../config/envConfig";

const verificationTemplate = (token: string, name: string) => {
  const url = `${envConfig.frontend}/verify-email/${token}`;

  return `<!DOCTYPE html>
        <html>
        <head>
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; text-align: center; padding: 20px;">
            <div style="max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <a href=${envConfig.frontend}>
               <img src="https://firebasestorage.googleapis.com/v0/b/mern-tours-e23a8.appspot.com/o/assets%2Flogo.png?alt=media&token=626fdce0-f733-49d0-bdcb-ea7f63b0963a" alt="Viatours" style="display: block; width: 162px; height: 42px;">
            <div style="text-align: center;">
                    <img src="https://firebasestorage.googleapis.com/v0/b/mern-tours-e23a8.appspot.com/o/assets%2Fsuccess.png?alt=media&token=6952e61b-0fbb-4539-94fa-2b2ba40f9e37" alt="mern-tours" style="height:60px;width:60px;"/>
                    <h2 style="color: #1d1d1d;">Verify Your Email</h2>
                </div>
                <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
                <p style="color: #555; font-size: 14px;">Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
                <a href=${url} style="display: inline-block; background: #ff5722; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; margin: 20px 0;">Verify Email</a>
                <p style="color: #555; font-size: 14px;">If you did not create an account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:</p>
                <p style="color: #007bff; font-size: 12px; word-break: break-all;">${url}</p>
                <p style="color: #777; font-size: 12px;">&copy; 2025 MERN Tours. All Rights Reserved.</p>
            </div>
        </body>
        </html>
        `;
};

export default verificationTemplate;
